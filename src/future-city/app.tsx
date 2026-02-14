import { useState, useEffect, useRef } from 'react';
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';
import toast, { Toaster } from 'react-hot-toast';
import LoginPage from './LoginPage';
import TwoFactorPage from './TwoFactorPage';
import Dashboard from './Dashboard';
import { utils } from 'ethers';

const AEDZ_CONTRACT_ADDRESS = '0xee6a1a4360aA0101cCC6C2d4671a79c3DF778E56';
const POOL_CONTRACT_ADDRESS = '0xC9d5040aAdf39C4ef71Ab32F9913cE21e70c6D2C';
const WS_URL = 'ws://165.245.144.184:3000'; // Update with your WebSocket URL

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
  const [addresses, setAddresses] = useState({
    fcvAtaAddress: '',
    fccAtaAddress: '',
  });
  const [pendingTx, setPendingTx] = useState<{
    type: 'approve' | 'deposit' | null;
    amount: string;
  }>({ type: null, amount: '0' });

  const wsRef = useRef<WebSocket | null>(null);

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
      inputs: [
        { name: 'uuid', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },

      ],
      outputs: [],
    },
  ] as const;

  // WebSocket connection
  const connectWebSocket = () => {
    if (!user?.accessToken) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${user.accessToken}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'deposit_success' || data.message === 'deposit success') {
          toast.success('Deposit processed successfully! Your FCV balance has been updated.');
          fetchBalances();
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (user?.accessToken) {
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current = ws;
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Handle login
  const handleLogin = async (credentials: any) => {
    try {
      const response = await fetch('http://165.245.144.184:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.requires2FA) {
        setUser({ ...credentials, tempToken: data.accessToken });
        setAuthState('2fa');
        toast.success('Please enter your 2FA code');
      } else if (data.success) {
        setUser(data.data);
        setAuthState('authenticated');
        toast.success('Login successful!');
        initializeFCM(data.data.accessToken);
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
      const response = await fetch('http://165.245.144.184:3000/api/v1/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: user?.tempToken,
          code: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setAuthState('authenticated');
        toast.success('2FA verified successfully!');
        initializeFCM(data.data.accessToken);
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

    if (isConfirmed && pendingTx.type && hash) {
      toast.dismiss('tx-confirming');

      if (pendingTx.type === 'approve') {
        toast.success('Approval confirmed! Now depositing...', { id: 'approve-success' });
        // Automatically trigger deposit after approval
        executeDeposit(pendingTx.amount);
      } else if (pendingTx.type === 'deposit') {
        toast.success('Deposit confirmed on blockchain!', { id: 'deposit-success' });
        // Call convert API with the transaction hash
        convertToFCV(hash);
        setPendingTx({ type: null, amount: '0' });
      }
    }
  }, [isConfirming, isConfirmed, pendingTx, hash]);

  // Execute deposit (called after approval is confirmed)
  const executeDeposit = async (amount: string) => {
    try {
      if (!AEDZDecimals) throw new Error('Could not fetch AEDZ decimals');

      const amountInWei = parseUnits(amount, AEDZDecimals);

      setPendingTx({ type: 'deposit', amount });
     // Convert UUID to bytes32
const bytes32User = utils.hexZeroPad(
  '0x' + user.userId.replace(/-/g, ''), 
  32
);
      writeContract({
        address: POOL_CONTRACT_ADDRESS,
        abi: POOL_ABI,
        functionName: 'deposit',
        args: [bytes32User, amountInWei],
        chainId: baseSepolia.id,
      });
    } catch (error: any) {
      toast.error('Deposit failed: ' + error.message);
      setPendingTx({ type: null, amount: '0' });
    }
  };

  // Convert AEDZ to FCV (deposit to contract with approve + deposit flow)
  const depositAndConvert = async (amount: string) => {
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

  // Convert AEDZ to FCV via API (called after deposit confirmation)
  const convertToFCV = async (txHash: string) => {
    try {
      toast.loading('Processing conversion...', { id: 'converting' });

      const response = await fetch('http://165.245.144.184:3000/api/v1/wallet/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify({ tx_hash: txHash }),
      });

      const data = await response.json();
      toast.dismiss('converting');

      if (data.success) {
        toast.success(data.message || 'Conversion initiated! You will receive a notification when complete.', {
          duration: 5000,
        });

        // Connect to WebSocket to listen for deposit completion
        connectWebSocket();

        // Also refetch balances after a short delay
        setTimeout(() => {
          refetchAEDZBalance();
          fetchBalances();
        }, 3000);
      } else {
        toast.error(data.message || 'Conversion failed');
      }
    } catch (error: any) {
      toast.dismiss('converting');
      toast.error('Conversion failed: ' + error.message);
    }
  };

  // Transfer FCV to another user
  const transferFCV = async (recipientAddress: string, amount: string) => {
    try {
      toast.loading('Transferring FCV...', { id: 'transfer-fcv' });

      const response = await fetch('http://165.245.144.184:3000/api/v1/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();
      toast.dismiss('transfer-fcv');

      if (data.success) {
        toast.success(data.message || 'Transfer successful!');
        fetchBalances();
      } else {
        toast.error(data.message || 'Transfer failed');
      }
    } catch (error: any) {
      toast.dismiss('transfer-fcv');
      toast.error('Transfer failed: ' + error.message);
    }
  };

  // Fetch all balances from backend
  const fetchBalances = async () => {
    try {
      const response = await fetch('http://165.245.144.184:3000/api/v1/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setBalances(prev => ({
          ...prev,
          AEDZ: result.data.totalInvestmentAED || '0',
          fcv: result.data.fcvBalance || '0',
          fcc: result.data.fccBalance || '0',
        }));
        setAddresses({
          fcvAtaAddress: result.data.fcvAtaAddress || '',
          fccAtaAddress: result.data.fccAtaAddress || '',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Fetch balances when authenticated
  useEffect(() => {
    if (authState === 'authenticated' && user) {
      fetchBalances();
      connectWebSocket();

      const interval = setInterval(fetchBalances, 30000);
      return () => {
        clearInterval(interval);
        disconnectWebSocket();
      };
    }
  }, [authState, user]);

  // Logout
  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
    disconnect();
    disconnectWebSocket();
    setBalances({ wallet: '0', AEDZ: '0', fcv: '0', fcc: '0' });
    setAddresses({ fcvAtaAddress: '', fccAtaAddress: '' });
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
          addresses={addresses}
          onConnectWallet={connectWallet}
          onDepositAndConvert={depositAndConvert}
          onTransferFCV={transferFCV}
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