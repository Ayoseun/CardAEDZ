import { useState } from 'react';
import {
    ArrowDownLeft, 
    Loader,
    Lock,
    Wallet,
    Copy,
    Check,
    QrCode
} from 'lucide-react';

export function TopUpModal({ 
    onClose, 
    walletBalance, 
    onDeposit, 
    mode = 'topup',
    kernelAccount
}: any) {
    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState<'EVM' | 'Solana'>('EVM');
    const [isDepositing, setIsDepositing] = useState(false);
    const [step, setStep] = useState<'input' | 'address' | 'processing'>('input');
    const [copiedAddress, setCopiedAddress] = useState(false);

    const isTopUpMode = mode === 'topup';
    const isFundMode = mode === 'fund';

    // Get wallet addresses
    const evmAddress = kernelAccount?.address;
    const solanaAddress = 'Sol...'; // This would come from Web3Auth Solana provider

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Invalid amount');
            return;
        }

        if (isTopUpMode && parseFloat(amount) > walletBalance) {
            alert('Insufficient wallet balance');
            return;
        }

        setIsDepositing(true);

        if (isFundMode) {
            // Show address for funding
            setStep('address');
            setIsDepositing(false);
        } else {
            // Top up card from wallet to escrow
            setStep('processing');
            try {
                await onDeposit(amount, selectedWallet);
                onClose();
            } catch (error) {
                console.error('Deposit failed:', error);
                alert('Deposit failed. Please try again.');
            } finally {
                setIsDepositing(false);
                setStep('input');
            }
        }
    };

    const copyAddress = () => {
        const address = selectedWallet === 'EVM' ? evmAddress : solanaAddress;
        navigator.clipboard.writeText(address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const currentAddress = selectedWallet === 'EVM' ? evmAddress : solanaAddress;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {isTopUpMode ? 'Top Up Card' : 'Fund Wallet'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    {isTopUpMode 
                        ? `Transfer from your wallet to card balance`
                        : `Add crypto to your wallet from external sources`
                    }
                </p>

                {step === 'input' && (
                    <>
                        {/* Wallet Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isTopUpMode ? 'Transfer From' : 'Receive Network'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedWallet('EVM')}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        selectedWallet === 'EVM'
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Wallet className="w-5 h-5 text-indigo-600" />
                                        <span className="font-semibold text-gray-900">EVM</span>
                                    </div>
                                    <p className="text-xs text-gray-600">ZeroDev Wallet</p>
                                    {isTopUpMode && (
                                        <p className="text-sm font-semibold text-indigo-600 mt-1">
                                            ${walletBalance.toFixed(2)}
                                        </p>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => setSelectedWallet('Solana')}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        selectedWallet === 'Solana'
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Wallet className="w-5 h-5 text-purple-600" />
                                        <span className="font-semibold text-gray-900">Solana</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Web3Auth Wallet</p>
                                    {isTopUpMode && (
                                        <p className="text-sm font-semibold text-purple-600 mt-1">
                                            $0.00
                                        </p>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (USDC)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    step="0.01"
                                    max={isTopUpMode ? walletBalance : undefined}
                                />
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="flex space-x-2">
                                {[25, 50, 100].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setAmount(preset.toString())}
                                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                    >
                                        ${preset}
                                    </button>
                                ))}
                                {isTopUpMode && (
                                    <button
                                        onClick={() => setAmount(walletBalance.toString())}
                                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                    >
                                        Max
                                    </button>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className={`${isTopUpMode ? 'bg-blue-50' : 'bg-green-50'} rounded-lg p-3 text-sm`}>
                                <div className="flex items-start space-x-2">
                                    {isTopUpMode ? (
                                        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                    ) : (
                                        <Wallet className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    )}
                                    <p className={isTopUpMode ? 'text-blue-900' : 'text-green-900'}>
                                        {isTopUpMode 
                                            ? 'Funds will be moved to your card escrow and available for spending immediately.'
                                            : 'Send USDC from any wallet to your address on the next screen.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={isDepositing}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={isDepositing || !amount}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                <ArrowDownLeft className="w-4 h-4" />
                                <span>{isTopUpMode ? 'Top Up' : 'Continue'}</span>
                            </button>
                        </div>
                    </>
                )}

                {step === 'address' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Send {amount} USDC
                            </h3>
                            <p className="text-sm text-gray-600">
                                To your {selectedWallet} wallet address
                            </p>
                        </div>

                        {/* Address Display */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-xs text-gray-500 mb-2">{selectedWallet} Address</p>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                <p className="font-mono text-sm text-gray-900 truncate flex-1">
                                    {currentAddress}
                                </p>
                                <button
                                    onClick={copyAddress}
                                    className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {copiedAddress ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="bg-white border-4 border-gray-200 rounded-xl p-4 mb-4">
                            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                <QrCode className="w-24 h-24 text-gray-400" />
                            </div>
                        </div>

                        {/* Network Info */}
                        <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-900">
                                <strong>Network:</strong> {selectedWallet === 'EVM' ? 'Base Sepolia' : 'Solana Devnet'}
                            </p>
                            <p className="text-xs text-yellow-800 mt-1">
                                Make sure to send on the correct network to avoid loss of funds
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            Done
                        </button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="text-center py-8">
                        <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                            Processing Top Up...
                        </p>
                        <p className="text-sm text-gray-500">
                            Please confirm the transaction in your wallet
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}