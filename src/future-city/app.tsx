import { useState, useEffect, useRef } from 'react';
import {
  WagmiProvider, createConfig, http,
  useAccount, useConnect, useDisconnect, useSwitchChain,
  useReadContract, useWriteContract, useWaitForTransactionReceipt,
} from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';
import toast, { Toaster } from 'react-hot-toast';
import LoginPage from './LoginPage';
import TwoFactorPage from './TwoFactorPage';
import Dashboard from './Dashboard';
import { utils } from 'ethers';
import { FUTURE_CITY_AEDZ_POOL_CONTRACT_ADDRESS, FUTURE_CITY_AEDZ_CONTRACT_ADDRESS, FUTURE_CITY_API_URL, FUTURE_CITY_WALLET_CONNECT_PROJECT_ID } from '../constants/config';
import { isTokenValid } from './utils/token';

const AEDZ_CONTRACT_ADDRESS = FUTURE_CITY_AEDZ_CONTRACT_ADDRESS!;
const POOL_CONTRACT_ADDRESS  = FUTURE_CITY_AEDZ_POOL_CONTRACT_ADDRESS!;
const USER_STORAGE_KEY = 'futurecity_user';           // Key for localStorage
const AEDZ_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const POOL_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'uuid', type: 'bytes32' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: FUTURE_CITY_WALLET_CONNECT_PROJECT_ID }),
  ],
  transports: { [baseSepolia.id]: http() },
});

const queryClient = new QueryClient();

// ─────────────────────────────────────────────────────────────────────────────

function AppContent() {
  const [authState, setAuthState] = useState<'login' | '2fa' | 'authenticated'>('login');
  const [user, setUser]           = useState<any>(null);
  const [balances, setBalances]   = useState({ wallet: '0', AEDZ: '0', fcv: '0', fcc: '0' });
  const [addresses, setAddresses] = useState({ fcvAtaAddress: '', fccAtaAddress: '' });
  const [pendingTx, setPendingTx] = useState<{ type: 'approve' | 'deposit' | null; amount: string }>({ type: null, amount: '0' });

  const wsRef = useRef<WebSocket | null>(null);

  // ── Wagmi hooks ────────────────────────────────────────────────────────────
  const { address, isConnected }                                      = useAccount();
  const { connect, connectors }                                       = useConnect();
  const { disconnect }                                                 = useDisconnect();
  const { switchChain }                                               = useSwitchChain();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed }           = useWaitForTransactionReceipt({ hash });

  const { data: AEDZBalance, refetch: refetchAEDZBalance } = useReadContract({
    address: AEDZ_CONTRACT_ADDRESS,
    abi:     AEDZ_ABI,
    functionName: 'balanceOf',
    args:    address ? [address] : undefined,
    chainId: baseSepolia.id,
  });

  const { data: AEDZDecimals } = useReadContract({
    address: AEDZ_CONTRACT_ADDRESS,
    abi:     AEDZ_ABI,
    functionName: 'decimals',
    chainId: baseSepolia.id,
  });
  // ── Restore session from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate token expiration
        if (userData.accessToken && isTokenValid(userData.accessToken)) {
          setUser(userData);
          setAuthState('authenticated');
        } else {
          // Token expired or missing → clear storage
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);
  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWebSocket = () => {
    if (!user?.accessToken) return;
    const ws = new WebSocket(`ws://${FUTURE_CITY_API_URL}:3000/ws?token=${user.accessToken}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'deposit_success' || data.message === 'deposit success') {
          toast.success('Deposit processed! FCV balance updated.');
          fetchBalances();
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      setTimeout(() => { if (user?.accessToken) connectWebSocket(); }, 3000);
    };
    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin = async (credentials: any) => {
    try {
      const res  = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();

      if (data.requires2FA) {
        setUser({ ...credentials, tempToken: data.accessToken });
        setAuthState('2fa');
        toast.success('Please enter your 2FA code');
      } else if (data.success) {
        // Save user data to localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data));
        setUser(data.data);
        setAuthState('authenticated');
        toast.success('Login successful!');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err: any) {
      toast.error('Login failed: ' + err.message);
    }
  };

  const handle2FA = async (code: any) => {
    try {
      const res  = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: user?.tempToken, code }),
      });
      const data = await res.json();
      if (data.success) {
         // Save user data to localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data));
        setUser(data.data);
        setAuthState('authenticated');
        toast.success('2FA verified!');
      } else {
        toast.error(data.message || '2FA verification failed');
      }
    } catch (err: any) {
      toast.error('2FA failed: ' + err.message);
    }
  };

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      connect({ connector: connectors[0], chainId: baseSepolia.id });
      setTimeout(() => { if (isConnected) switchChain({ chainId: baseSepolia.id }); }, 1000);
      toast.success('Wallet connected!');
    } catch (err: any) {
      toast.error('Failed to connect wallet: ' + err.message);
    }
  };

  // ── AEDZ balance watch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (AEDZBalance && AEDZDecimals) {
      const formatted = formatUnits(AEDZBalance, AEDZDecimals);
      setBalances((prev) => ({ ...prev, wallet: formatted }));
      if (parseFloat(formatted) === 0) toast.error("You don't have AEDZ. Please buy some first!", { duration: 5000 });
    }
  }, [AEDZBalance, AEDZDecimals]);

  // ── TX error handling ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!writeError) return;
    toast.dismiss('tx-confirming');
    toast.dismiss('approve-request');
    const msg = writeError.message ?? '';
    if (msg.includes('rejected') || msg.includes('denied')) {
      toast.error('Transaction cancelled by user', { id: 'tx-cancelled' });
    } else {
      toast.error(`Transaction failed: ${msg}`, { id: 'tx-error' });
    }
    setPendingTx({ type: null, amount: '0' });
    reset();
  }, [writeError, reset]);

  // ── TX confirmation watch ──────────────────────────────────────────────────
  useEffect(() => {
    if (isConfirming) {
      toast.loading(`${pendingTx.type === 'approve' ? 'Approval' : 'Deposit'} in progress…`, { id: 'tx-confirming' });
    }
    if (isConfirmed && pendingTx.type && hash) {
      toast.dismiss('tx-confirming');
      if (pendingTx.type === 'approve') {
        toast.success('Approval confirmed! Now depositing…', { id: 'approve-success' });
        executeDeposit(pendingTx.amount);
      } else if (pendingTx.type === 'deposit') {
        toast.success('Deposit confirmed on blockchain!', { id: 'deposit-success' });
        convertToFCV(hash);
        setPendingTx({ type: null, amount: '0' });
      }
    }
  }, [isConfirming, isConfirmed, pendingTx, hash]);

  // ── Blockchain actions ─────────────────────────────────────────────────────
  const executeDeposit = async (amount: string) => {
    try {
      if (!AEDZDecimals) throw new Error('Could not fetch AEDZ decimals');
      const amountInWei  = parseUnits(amount, AEDZDecimals);
      const bytes32User  = utils.hexZeroPad('0x' + user.userId.replace(/-/g, ''), 32);
      setPendingTx({ type: 'deposit', amount });
      writeContract({
        address: POOL_CONTRACT_ADDRESS,
        abi:     POOL_ABI,
        functionName: 'deposit',
        // @ts-ignore
        args:    [bytes32User, amountInWei],
        chainId: baseSepolia.id,
      });
    } catch (err: any) {
      toast.error('Deposit failed: ' + err.message);
      setPendingTx({ type: null, amount: '0' });
    }
  };

  const depositAndConvert = async (amount: string) => {
    if (!address)                         { toast.error('Connect your wallet first'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount');       return; }
    try {
      if (!AEDZDecimals) throw new Error('Could not fetch AEDZ decimals');
      const amountInWei = parseUnits(amount, AEDZDecimals);
      if (AEDZBalance && amountInWei > AEDZBalance) { toast.error('Insufficient AEDZ balance'); return; }
      toast.loading('Please approve AEDZ spending in your wallet…', { id: 'approve-request' });
      setPendingTx({ type: 'approve', amount });
      writeContract({
        address: AEDZ_CONTRACT_ADDRESS,
        abi:     AEDZ_ABI,
        functionName: 'approve',
        args:    [POOL_CONTRACT_ADDRESS, amountInWei],
        chainId: baseSepolia.id,
      });
      toast.dismiss('approve-request');
    } catch (err: any) {
      toast.error('Transaction failed: ' + err.message);
      setPendingTx({ type: null, amount: '0' });
      throw err;
    }
  };

  const convertToFCV = async (txHash: string) => {
    try {
      toast.loading('Processing conversion…', { id: 'converting' });
      const res  = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/wallet/initiate-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.accessToken}` },
        body: JSON.stringify({ tx_hash: txHash }),
      });
      const data = await res.json();
      toast.dismiss('converting');
      if (data.success) {
        toast.success(data.message || 'Conversion initiated! Notification will follow.', { duration: 5000 });
        connectWebSocket();
        setTimeout(() => { refetchAEDZBalance(); fetchBalances(); }, 3000);
      } else {
        toast.error(data.message || 'Conversion failed');
      }
    } catch (err: any) {
      toast.dismiss('converting');
      toast.error('Conversion failed: ' + err.message);
    }
  };

  // ── API actions ────────────────────────────────────────────────────────────
  const transferFCV = async (recipientAddress: string, amount: string) => {
    try {
      toast.loading('Transferring FCV…', { id: 'transfer-fcv' });
      const res  = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/wallet/send-fcv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.accessToken}` },
        body: JSON.stringify({ recipient_address: recipientAddress, amount, currency: 'FCV', pin: '1234' }),
      });
      const data = await res.json();
      toast.dismiss('transfer-fcv');
      if (data.success) { toast.success(data.message || 'Transfer successful!'); fetchBalances(); }
      else toast.error(data.message || 'Transfer failed');
    } catch (err: any) {
      toast.dismiss('transfer-fcv');
      toast.error('Transfer failed: ' + err.message);
    }
  };

  const withdrawFCV = async (amount: string) => {
    try {
      toast.loading('Processing withdrawal…', { id: 'withdraw-fcv' });
      const res  = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/wallet/initiate-withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.accessToken}` },
        body: JSON.stringify({ amount: amount.toString(), wallet_address: address!.toString() }),
      });
      const data = await res.json();
      toast.dismiss('withdraw-fcv');
      if (data.success) { toast.success(data.message || 'Withdrawal successful!'); fetchBalances(); refetchAEDZBalance(); }
      else toast.error(data.message || 'Withdrawal failed');
    } catch (err: any) {
      toast.dismiss('withdraw-fcv');
      toast.error('Withdrawal failed: ' + err.message);
    }
  };

  const fetchBalances = async () => {
    try {
      const res    = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/wallet/balance`, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      const result = await res.json();
      if (result.success && result.data) {
        setBalances((prev) => ({
          ...prev,
          AEDZ: result.data.totalInvestmentAED || '0',
          fcv:  result.data.fcvBalance          || '0',
          fcc:  result.data.fccBalance           || '0',
        }));
        setAddresses({
          fcvAtaAddress: result.data.fcvAtaAddress || '',
          fccAtaAddress: result.data.fccAtaAddress || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authState === 'authenticated' && user) {
      fetchBalances();
      connectWebSocket();
      const interval = setInterval(fetchBalances, 30000);
      return () => { clearInterval(interval); disconnectWebSocket(); };
    }
  }, [authState, user]);

 const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthState('login');
    setUser(null);
    disconnect();
    disconnectWebSocket();
    setBalances({ wallet: '0', AEDZ: '0', fcv: '0', fcc: '0' });
    setAddresses({ fcvAtaAddress: '', fccAtaAddress: '' });
    setPendingTx({ type: null, amount: '0' });
    toast.success('Logged out successfully');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen animated-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#131827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#00f0ff', secondary: '#131827' } },
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
          apiUrl={FUTURE_CITY_API_URL}  
          onConnectWallet={connectWallet}
          onDepositAndConvert={depositAndConvert}
          onTransferFCV={transferFCV}
          onWithdraw={withdrawFCV}
          onLogout={handleLogout}
          isTransacting={isPending || isConfirming}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function FApp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}