import { useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Send, RefreshCw, Info, LogOut, Copy, Check } from 'lucide-react';

interface User {
  email?: string;
  accessToken?: string;
}

interface Balances {
  wallet: string;
  AEDZ: string;
  fcv: string;
  fcc: string;
}

interface Addresses {
  fcvAtaAddress: string;
  fccAtaAddress: string;
}

interface DashboardProps {
  user: User | null;
  walletAddress: string;
  isConnected: boolean;
  balances: Balances;
  addresses: Addresses;
  onConnectWallet: () => void;
  onDepositAndConvert: (amount: string) => Promise<void>;
  onTransferFCV: (recipientAddress: string, amount: string) => Promise<void>;
  onLogout: () => void;
  isTransacting?: boolean;
}

export default function Dashboard({
  user,
  walletAddress,
  isConnected,
  balances,
  addresses,
  onConnectWallet,
  onDepositAndConvert,
  onTransferFCV,
  onLogout,
  isTransacting = false, 
}: DashboardProps) {
  const [convertAmount, setConvertAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedFcv, setCopiedFcv] = useState(false);
  const [copiedFcc, setCopiedFcc] = useState(false);

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(convertAmount) > parseFloat(balances.wallet)) {
      toast.error('Insufficient AEDZ balance in wallet');
      return;
    }

    setIsConverting(true);
    try {
      await onDepositAndConvert(convertAmount);
      setConvertAmount('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!recipientAddress || recipientAddress.trim() === '') {
      toast.error('Please enter a recipient address');
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balances.fcv)) {
      toast.error('Insufficient FCV balance');
      return;
    }

    setIsTransferring(true);
    try {
      await onTransferFCV(recipientAddress, transferAmount);
      setTransferAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string, type: 'wallet' | 'fcv' | 'fcc') => {
    navigator.clipboard.writeText(text);
    
    if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } else if (type === 'fcv') {
      setCopiedFcv(true);
      setTimeout(() => setCopiedFcv(false), 2000);
    } else if (type === 'fcc') {
      setCopiedFcc(true);
      setTimeout(() => setCopiedFcc(false), 2000);
    }
    
    toast.success('Address copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Future City</h1>
            <p className="text-gray-600 text-sm">Welcome back, {user?.email}</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {isConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono text-gray-700">{formatAddress(walletAddress)}</span>
                <button 
                  onClick={() => copyToClipboard(walletAddress, 'wallet')} 
                  className="ml-1 hover:text-indigo-600 transition-colors"
                >
                  {copiedWallet ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your wallet to access all features and manage your crypto assets
            </p>
            <button 
              onClick={onConnectWallet} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          </div>
        )}

        {isConnected && (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* AEDZ Balance */}
              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">AEDZ Balance</span>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💵</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {parseFloat(balances.AEDZ).toFixed(2)}
                </div>
                <div className="text-gray-500 text-sm">AEDZ (In Contract)</div>
                <div className="text-gray-500 text-xs mt-2">
                  Available in wallet: <strong className="text-gray-900">{parseFloat(balances.wallet).toFixed(2)} د.إ</strong>
                </div>
              </div>

              {/* FCV Balance */}
              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">FCV Balance</span>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🪙</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {parseFloat(balances.fcv).toFixed(2)}
                </div>
                <div className="text-gray-500 text-sm mb-2">FCV (Solana)</div>
                
                {addresses.fcvAtaAddress && (
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Token Address:</p>
                        <p className="text-xs font-mono text-purple-700 truncate">
                          {formatAddress(addresses.fcvAtaAddress)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(addresses.fcvAtaAddress, 'fcv')}
                        className="flex-shrink-0 p-1.5 hover:bg-purple-100 rounded transition-colors"
                      >
                        {copiedFcv ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FCC Balance */}
              <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">FCC Balance</span>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💎</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {parseFloat(balances.fcc).toFixed(2)}
                </div>
                <div className="text-gray-500 text-sm mb-2">FCC (Solana)</div>
                
                {addresses.fccAtaAddress && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Token Address:</p>
                        <p className="text-xs font-mono text-green-700 truncate">
                          {formatAddress(addresses.fccAtaAddress)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(addresses.fccAtaAddress, 'fcc')}
                        className="flex-shrink-0 p-1.5 hover:bg-green-100 rounded transition-colors"
                      >
                        {copiedFcc ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Convert AEDZ to FCV (Web3 Transaction) */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Convert AEDZ to FCV</h3>
                    <p className="text-gray-600 text-sm">Deposit & convert to FCV tokens</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Amount (AEDZ)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={isTransacting || isConverting}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => setConvertAmount(balances.wallet)}
                        disabled={isTransacting || isConverting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-semibold hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Available in wallet: {parseFloat(balances.wallet).toFixed(2)} AEDZ
                    </p>
                    {convertAmount && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">You will receive:</span>
                          <span className="font-bold text-purple-600">
                            ≈ {(parseFloat(convertAmount)).toFixed(2)} FCV
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={isTransacting || isConverting || !convertAmount}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTransacting || isConverting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Convert to FCV</span>
                      </>
                    )}
                  </button>

                  <p className="text-gray-500 text-xs text-center">
                    Requires wallet approval + deposit to contract, then conversion to FCV
                  </p>
                </div>
              </div>

              {/* Transfer FCV to Another User (API Call) */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Transfer FCV</h3>
                    <p className="text-gray-600 text-sm">Send FCV to another user</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Recipient Address (Solana)
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Enter Solana wallet address"
                      disabled={isTransferring}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Amount (FCV)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={isTransferring}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => setTransferAmount(balances.fcv)}
                        disabled={isTransferring}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-semibold hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Available: {parseFloat(balances.fcv).toFixed(2)} FCV
                    </p>
                  </div>

                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !transferAmount || !recipientAddress}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTransferring ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Transfer FCV</span>
                      </>
                    )}
                  </button>

                  <p className="text-gray-500 text-xs text-center">
                    Transfer will be processed on Solana network
                  </p>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                How it works
              </h3>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p>Connect your wallet and ensure you have AEDZ on Base Sepolia network</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p>Convert AEDZ to FCV by approving and depositing to the contract - conversion happens automatically</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p>Transfer your FCV tokens to other users on the Solana network using their wallet address</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <p>You'll receive push notifications when conversions are complete and balances are updated</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}