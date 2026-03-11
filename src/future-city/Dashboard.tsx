import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet, Send, RefreshCw, Info, LogOut, Copy, Check,
   List,  Eye, ArrowDownToLine,
  LayoutDashboard, Home, BarChart3, Tag,
} from 'lucide-react';
import { User, Balances, Addresses, ApiTransaction, Transaction } from './types';
import { mapApiTransactionToUi } from './utils/transactions';
import { getTransactionIcon, getIconBgColor, getStatusBadge } from './utils/ui';
import TransactionDetailModal from './TransactionDetailModal';
import PropertiesPage from './PropertiesPage';
import MyInvestmentsPage from './MyInvestmentsPage';
import FCCMarketplacePage from './FCCMarketplacePage';
import { FUTURE_CITY_API_URL } from '../constants/config';

interface DashboardProps {
  user: User | null;
  walletAddress: string;
  isConnected: boolean;
  balances: Balances;
  addresses: Addresses;
  apiUrl: string;
  onConnectWallet: () => void;
  onDepositAndConvert: (amount: string) => Promise<void>;
  onTransferFCV: (recipientAddress: string, amount: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
  onLogout: () => void;
  isTransacting?: boolean;
}

type NavTab = 'wallet' | 'properties' | 'marketplace' | 'investments';

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof Wallet }[] = [
  { id: 'wallet',      label: 'Wallet',         icon: LayoutDashboard },
  { id: 'properties',  label: 'Properties',     icon: Home            },
  { id: 'marketplace', label: 'FCC Marketplace',icon: Tag             },
  { id: 'investments', label: 'My Investments', icon: BarChart3       },
];

export default function Dashboard({
  user,
  walletAddress,
  isConnected,
  balances,
  addresses,
  apiUrl,
  onConnectWallet,
  onDepositAndConvert,
  onTransferFCV,
  onWithdraw,
  onLogout,
  isTransacting = false,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('wallet');
  const [convertAmount, setConvertAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedFcv, setCopiedFcv] = useState(false);
  const [copiedFcc, setCopiedFcc] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    if (!user?.accessToken) return;
    setIsLoadingTransactions(true);
    try {
      const response = await fetch(`http://${FUTURE_CITY_API_URL}:3000/api/v1/wallet/transactions`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setTransactions(result.data.map((apiTx: ApiTransaction) => mapApiTransactionToUi(apiTx)));
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (user?.accessToken && isConnected) fetchTransactions();
  }, [user?.accessToken, isConnected]);

  useEffect(() => {
    if (user?.accessToken && isConnected) {
      const hasBalances = parseFloat(balances.fcv) > 0 || parseFloat(balances.fcc) > 0 || parseFloat(balances.AEDZ) > 0;
      if (hasBalances) fetchTransactions();
    }
  }, [balances.fcv, balances.fcc, balances.AEDZ]);

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) { toast.error('Please enter a valid amount'); return; }
    if (parseFloat(convertAmount) > parseFloat(balances.wallet)) { toast.error('Insufficient AEDZ balance in wallet'); return; }
    setIsConverting(true);
    try {
      await onDepositAndConvert(convertAmount);
      setConvertAmount('');
      setTimeout(() => fetchTransactions(), 2000);
    } catch (error) { console.error(error); }
    finally { setIsConverting(false); }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) { toast.error('Please enter a valid amount'); return; }
    if (!recipientAddress || recipientAddress.trim() === '') { toast.error('Please enter a recipient address'); return; }
    if (parseFloat(transferAmount) > parseFloat(balances.fcv)) { toast.error('Insufficient FCV balance'); return; }
    setIsTransferring(true);
    try {
      await onTransferFCV(recipientAddress, transferAmount);
      setTransferAmount('');
      setRecipientAddress('');
      setTimeout(() => fetchTransactions(), 2000);
    } catch (error) { console.error(error); }
    finally { setIsTransferring(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) { toast.error('Please enter a valid amount'); return; }
    if (parseFloat(withdrawAmount) > parseFloat(balances.fcv)) { toast.error('Insufficient FCV balance'); return; }
    setIsWithdrawing(true);
    try {
      await onWithdraw(withdrawAmount);
      setWithdrawAmount('');
      setTimeout(() => fetchTransactions(), 2000);
    } catch (error) { console.error(error); }
    finally { setIsWithdrawing(false); }
  };

  const handlePropertyInvest = async (propertyId: string, amount: number) => {
    toast.success(`Investment in property ${propertyId} initiated (${amount} tokens)`);
    // Wire to real API here
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string, type: 'wallet' | 'fcv' | 'fcc') => {
    navigator.clipboard.writeText(text);
    if (type === 'wallet') { setCopiedWallet(true); setTimeout(() => setCopiedWallet(false), 2000); }
    else if (type === 'fcv') { setCopiedFcv(true); setTimeout(() => setCopiedFcv(false), 2000); }
    else if (type === 'fcc') { setCopiedFcc(true); setTimeout(() => setCopiedFcc(false), 2000); }
    toast.success('Address copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-8">
      <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Future City</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono text-gray-700">{formatAddress(walletAddress)}</span>
                <button onClick={() => copyToClipboard(walletAddress, 'wallet')} className="ml-1 hover:text-indigo-600 transition-colors">
                  {copiedWallet ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            )}
            {/* Balance chips */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2">
                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-100">
                  {parseFloat(balances.fcv).toFixed(2)} FCV
                </span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-100">
                  {parseFloat(balances.fcc).toFixed(2)} FCC
                </span>
              </div>
            )}
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      {isConnected && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-1.5 flex gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-white text-indigo-700 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Not connected */}
        {!isConnected && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Connect your wallet to access all features and manage your crypto assets</p>
            <button onClick={onConnectWallet} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all inline-flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          </div>
        )}

        {/* ─── WALLET TAB ─────────────────────────────────────────────────────── */}
        {isConnected && activeTab === 'wallet' && (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">AEDZ Balance</span>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-xl">💵</span></div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{parseFloat(balances.AEDZ).toFixed(2)}</div>
                <div className="text-gray-500 text-sm">AEDZ (In Contract)</div>
                <div className="text-gray-500 text-xs mt-2">Available in wallet: <strong className="text-gray-900">{parseFloat(balances.wallet).toFixed(2)} د.إ</strong></div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">FCC Balance</span>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-xl">🪙</span></div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{parseFloat(balances.fcc).toFixed(2)}</div>
                <div className="text-gray-500 text-sm mb-3">FCC (Solana)</div>
                {/* List FCC shortcut */}
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="w-full py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-xs font-semibold hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 mb-2"
                >
                  <Tag className="w-3.5 h-3.5" /> List FCC
                </button>
                {addresses.fcvAtaAddress && (
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Token Address:</p>
                        <p className="text-xs font-mono text-purple-700 truncate">{formatAddress(addresses.fcvAtaAddress)}</p>
                      </div>
                      <button onClick={() => copyToClipboard(addresses.fcvAtaAddress, 'fcv')} className="flex-shrink-0 p-1.5 hover:bg-purple-100 rounded transition-colors">
                        {copiedFcv ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">FCV Balance</span>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-xl">💎</span></div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{parseFloat(balances.fcv).toFixed(2)}</div>
                <div className="text-gray-500 text-sm mb-2">FCV (Solana)</div>
                {addresses.fccAtaAddress && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Token Address:</p>
                        <p className="text-xs font-mono text-green-700 truncate">{formatAddress(addresses.fccAtaAddress)}</p>
                      </div>
                      <button onClick={() => copyToClipboard(addresses.fccAtaAddress, 'fcc')} className="flex-shrink-0 p-1.5 hover:bg-green-100 rounded transition-colors">
                        {copiedFcc ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-green-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {/* Convert */}
              <div className="bg-white rounded-2xl shadow-xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Convert AEDZ → FCV</h3>
                    <p className="text-gray-500 text-xs">Deposit & convert to FCV tokens</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Amount (AEDZ)</label>
                    <div className="relative">
                      <input type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" disabled={isTransacting || isConverting} className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm" />
                      <button onClick={() => setConvertAmount(balances.wallet)} disabled={isTransacting || isConverting} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs font-bold hover:text-purple-600 transition-colors disabled:opacity-50">MAX</button>
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5">Available: {parseFloat(balances.wallet).toFixed(2)} AEDZ</p>
                    {convertAmount && (
                      <div className="mt-2 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 text-xs">You will receive:</span>
                          <span className="font-bold text-purple-600 text-sm">≈ {parseFloat(convertAmount).toFixed(2)} FCV</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleConvert} disabled={isTransacting || isConverting || !convertAmount} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                    {isTransacting || isConverting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Processing...</span></>) : (<><RefreshCw className="w-4 h-4" /><span>Convert to FCV</span></>)}
                  </button>
                </div>
              </div>

              {/* Transfer */}
              <div className="bg-white rounded-2xl shadow-xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Transfer FCV</h3>
                    <p className="text-gray-500 text-xs">Send FCV to another user</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Recipient Address</label>
                    <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Solana wallet address" disabled={isTransferring} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Amount (FCV)</label>
                    <div className="relative">
                      <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" disabled={isTransferring} className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 text-sm" />
                      <button onClick={() => setTransferAmount(balances.fcv)} disabled={isTransferring} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs font-bold">MAX</button>
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5">Available: {parseFloat(balances.fcv).toFixed(2)} FCV</p>
                  </div>
                  <button onClick={handleTransfer} disabled={isTransferring || !transferAmount || !recipientAddress} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                    {isTransferring ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Transferring...</span></>) : (<><Send className="w-4 h-4" /><span>Transfer FCV</span></>)}
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="bg-white rounded-2xl shadow-xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center"><ArrowDownToLine className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Withdraw FCV</h3>
                    <p className="text-gray-500 text-xs">Convert FCV back to AEDZ</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Amount (FCV)</label>
                    <div className="relative">
                      <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" disabled={isWithdrawing} className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 text-sm" />
                      <button onClick={() => setWithdrawAmount(balances.fcv)} disabled={isWithdrawing} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs font-bold">MAX</button>
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5">Available: {parseFloat(balances.fcv).toFixed(2)} FCV</p>
                    {withdrawAmount && (
                      <div className="mt-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 text-xs">You will receive:</span>
                          <span className="font-bold text-green-600 text-sm">≈ {parseFloat(withdrawAmount).toFixed(2)} AEDZ</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleWithdraw} disabled={isWithdrawing || !withdrawAmount} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                    {isWithdrawing ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Processing...</span></>) : (<><ArrowDownToLine className="w-4 h-4" /><span>Withdraw FCV</span></>)}
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                  <p className="text-gray-500 text-xs mt-0.5">All your recent transactions and activities</p>
                </div>
                <button onClick={fetchTransactions} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-14">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading transactions...</p>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <List className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-700 mb-1">No Transactions Yet</h4>
                  <p className="text-gray-400 text-sm text-center max-w-sm">Your transaction history will appear here once you start converting, transferring, or withdrawing tokens.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Type', 'Description', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getIconBgColor(tx.type)}`}>
                                {getTransactionIcon(tx.type)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{tx.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{tx.description}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount} {tx.token}
                            </div>
                            {tx.equivalentAmount && (
                              <div className="text-xs text-gray-400 mt-0.5">{tx.equivalentAmount} {tx.equivalentToken}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-800">{tx.date}</div>
                            <div className="text-xs text-gray-400">{tx.time}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button onClick={() => setSelectedTransaction(tx)} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl shadow-xl p-5 mt-5">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" /> How it works
              </h3>
              <div className="space-y-2.5 text-gray-500 text-sm">
                {[
                  'Connect your wallet and ensure you have AEDZ on Base Sepolia network',
                  'Convert AEDZ to FCV by approving and depositing to the contract',
                  'Browse properties and invest FCV to earn FCC property tokens',
                  "You'll receive notifications when conversions are complete",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── PROPERTIES TAB ─────────────────────────────────────────────────── */}
        {isConnected && activeTab === 'properties' && (
          <div className="-mx-4 md:-mx-8 -mb-8">
            <PropertiesPage
              fcvBalance={balances.fcv}
              accessToken={user?.accessToken ?? ''}
              apiUrl={apiUrl}
              onInvest={handlePropertyInvest}
              onGoToInvestments={() => setActiveTab('investments')}
            />
          </div>
        )}

        {/* ─── FCC MARKETPLACE TAB ────────────────────────────────────────────── */}
        {isConnected && activeTab === 'marketplace' && (
          <FCCMarketplacePage
            fccBalance={parseFloat(balances.fcc) || 0}
            walletAddress={walletAddress}
            accessToken={user?.accessToken ?? ''}
            apiUrl={apiUrl}
          />
        )}

        {/* ─── MY INVESTMENTS TAB ─────────────────────────────────────────────── */}
        {isConnected && activeTab === 'investments' && (
          <MyInvestmentsPage
            fcvBalance={balances.fcv}
            onInvest={handlePropertyInvest}
            onSellTokens={async (id, amount) => {
              toast.success(`Selling ${amount} tokens from investment ${id}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
