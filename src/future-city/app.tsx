import { useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {  baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';
import toast, { Toaster } from 'react-hot-toast';
import LoginPage from './LoginPage';
import TwoFactorPage from './TwoFactorPage';
import Dashboard from './Dashboard';

const AEDZ_CONTRACT_ADDRESS = '0xee6a1a4360aA0101cCC6C2d4671a79c3DF778E56';
const POOL_CONTRACT_ADDRESS = '0xdb09aB60c06ff615933381Dd4c33Ca27ADc25B67';

const AEDZ_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Wagmi configuration
const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: '010be9dddbaa8ce27d4572c201a51e012',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

function AppContent() {
  const [authState, setAuthState] = useState('login');
  const [user, setUser] = useState<any>(null);
  const [balances, setBalances] = useState({
    wallet: '0',
    AEDZ: '0',
    fcv: '0',
    fcc: '0',
  });
  const [pendingTx, setPendingTx] = useState<{
    type: 'approve' | 'deposit' | null;
    amount: string;
  }>({ type: null, amount: '0' });

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read AEDZ balance
  const { data: AEDZBalance, refetch: refetchAEDZBalance } = useReadContract({
    address: AEDZ_CONTRACT_ADDRESS,
    abi: AEDZ_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  });

  const { data: AEDZDecimals } = useReadContract({
    address: AEDZ_CONTRACT_ADDRESS,
    abi: AEDZ_ABI,
    functionName: 'decimals',
    chainId: baseSepolia.id,
  });

  // Pool contract ABI (deposit function)
  const POOL_ABI = [
    {
      name: 'deposit',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'amount', type: 'uint256' }],
      outputs: [],
    },
  ] as const;

  // Handle login
  const handleLogin = async (credentials: any) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.requires2FA) {
        setUser({ ...credentials, tempToken: data.tempToken });
        setAuthState('2fa');
        toast.success('Please enter your 2FA code');
      } else if (data.success) {
        setUser(data.data);
        setAuthState('authenticated');
        toast.success('Login successful!');
        initializeFCM(data.user.token);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    }
  };

  // Handle 2FA verification
  const handle2FA = async (code: any) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: user?.tempToken,
          code: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setAuthState('authenticated');
        toast.success('2FA verified successfully!');
        initializeFCM(data.user.token);
      } else {
        toast.error(data.message || '2FA verification failed');
      }
    } catch (error: any) {
      toast.error('2FA verification failed: ' + error.message);
    }
  };

  // Initialize Firebase Cloud Messaging
  const initializeFCM = (userToken: any) => {
    console.log('Initializing FCM for user:', userToken);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'BALANCE_UPDATE') {
          fetchBalances();
        }
      });
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      const connector = connectors[0];
      connect({ connector, chainId: baseSepolia.id });
      
      setTimeout(() => {
        if (isConnected) {
          switchChain({ chainId: baseSepolia.id });
        }
      }, 1000);
      
      toast.success('Wallet connected!');
    } catch (error: any) {
      toast.error('Failed to connect wallet: ' + error.message);
    }
  };

  // Check AEDZ balance
  useEffect(() => {
    if (AEDZBalance && AEDZDecimals) {
      const formattedBalance = formatUnits(AEDZBalance, AEDZDecimals);
      setBalances(prev => ({ ...prev, wallet: formattedBalance }));

      if (parseFloat(formattedBalance) === 0) {
        toast.error("You don't have AEDZ. Please buy some first!", {
          duration: 5000,
        });
      }
    }
  }, [AEDZBalance, AEDZDecimals]);

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      toast.dismiss('tx-confirming');
      toast.dismiss('approve-request');
      
      const errorMessage = writeError.message || '';
      
      // Check if user rejected the transaction
      if (errorMessage.includes('User rejected') || 
          errorMessage.includes('User denied') || 
          errorMessage.includes('rejected') ||
          errorMessage.includes('denied')) {
        toast.error('Transaction cancelled by user', { id: 'tx-cancelled' });
      } else {
        toast.error(`Transaction failed: ${errorMessage}`, { id: 'tx-error' });
      }
      
      // Reset pending transaction state
      setPendingTx({ type: null, amount: '0' });
      
      // Reset the write contract hook
      reset();
    }
  }, [writeError, reset]);

  // Monitor transaction confirmations
  useEffect(() => {
    if (isConfirming) {
      const txType = pendingTx.type === 'approve' ? 'Approval' : 'Deposit';
      toast.loading(`${txType} in progress...`, { id: 'tx-confirming' });
    }
    
    if (isConfirmed && pendingTx.type) {
      toast.dismiss('tx-confirming');
      
      if (pendingTx.type === 'approve') {
        toast.success('Approval confirmed! Now depositing...', { id: 'approve-success' });
        // Automatically trigger deposit after approval
        executeDeposit(pendingTx.amount);
      } else if (pendingTx.type === 'deposit') {
        toast.success('Deposit confirmed!', { id: 'deposit-success' });
        // Refetch balances
        refetchAEDZBalance();
        fetchBalances();
        setPendingTx({ type: null, amount: '0' });
      }
    }
  }, [isConfirming, isConfirmed, pendingTx]);

  // Execute deposit (called after approval is confirmed)
  const executeDeposit = async (amount: string) => {
    try {
      if (!AEDZDecimals) throw new Error('Could not fetch AEDZ decimals');
      
      const amountInWei = parseUnits(amount, AEDZDecimals);
      
      setPendingTx({ type: 'deposit', amount });

      writeContract({
        address: POOL_CONTRACT_ADDRESS,
        abi: POOL_ABI,
        functionName: 'deposit',
        args: [amountInWei],
        chainId: baseSepolia.id,
      });
    } catch (error: any) {
      toast.error('Deposit failed: ' + error.message);
      setPendingTx({ type: null, amount: '0' });
    }
  };

  // Transfer AEDZ to contract (approve + deposit flow)
  const transferAEDZ = async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      if (!AEDZDecimals) throw new Error('Could not fetch AEDZ decimals');

      const amountInWei = parseUnits(amount, AEDZDecimals);

      // Check if user has enough balance
      if (AEDZBalance && amountInWei > AEDZBalance) {
        toast.error('Insufficient AEDZ balance');
        return;
      }

      // Step 1: Approve
      toast.loading('Please approve AEDZ spending in your wallet...', { id: 'approve-request' });
      
      setPendingTx({ type: 'approve', amount });

      writeContract({
        address: AEDZ_CONTRACT_ADDRESS,
        abi: AEDZ_ABI,
        functionName: 'approve',
        args: [POOL_CONTRACT_ADDRESS, amountInWei],
        chainId: baseSepolia.id,
      });

      toast.dismiss('approve-request');
      
    } catch (error: any) {
      toast.error('Transaction failed: ' + error.message);
      setPendingTx({ type: null, amount: '0' });
      throw error;
    }
  };

  // Convert AEDZ to FCV
  const convertToFCV = async (amount: any) => {
    try {
      toast.loading('Converting AEDZ to FCV...');
      
      const response = await fetch('https://your-api.com/convert/AEDZ-to-fcv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Conversion initiated! You will receive a push notification when complete.');
        setTimeout(() => fetchBalances(), 5000);
      } else {
        toast.error(data.message || 'Conversion failed');
      }
    } catch (error: any) {
      toast.error('Conversion failed: ' + error.message);
    }
  };

  // Fetch all balances from backend
  const fetchBalances = async () => {
    try {
      const response = await fetch('https://your-api.com/balances', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBalances(prev => ({
          ...prev,
          AEDZ: data.balances.AEDZ || '0',
          fcv: data.balances.fcv || '0',
          fcc: data.balances.fcc || '0',
        }));
      }
    } catch (error: any) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Fetch balances when authenticated
  useEffect(() => {
    if (authState === 'authenticated' && user) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [authState, user]);

  // Logout
  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
    disconnect();
    setBalances({ wallet: '0', AEDZ: '0', fcv: '0', fcc: '0' });
    setPendingTx({ type: null, amount: '0' });
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen animated-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131827',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#00f0ff',
              secondary: '#131827',
            },
          },
        }}
      />
      
      {authState === 'login' && <LoginPage onLogin={handleLogin} />}
      
      {authState === '2fa' && <TwoFactorPage onVerify={handle2FA} />}
      
      {authState === 'authenticated' && (
        <Dashboard
          user={user}
          walletAddress={address || ''}
          isConnected={isConnected}
          balances={balances}
          onConnectWallet={connectWallet}
          onTransferAEDZ={transferAEDZ}
          onConvertToFCV={convertToFCV}
          onLogout={handleLogout}
          isTransacting={isPending || isConfirming}
        />
      )}
    </div>
  );
}

export function FApp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}