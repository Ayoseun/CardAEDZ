
import  { useState} from 'react';
import {
    ArrowDownLeft, 
    Loader,
    Lock
} from 'lucide-react';

export function DepositModal({ onClose, walletBalance, onDeposit }: any) {
    const [amount, setAmount] = useState('');
    const [network] = useState('Base');
    const [isDepositing, setIsDepositing] = useState(false);
    const [step, setStep] = useState<'input' | 'approving' | 'depositing'>('input');

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance) {
            alert('Invalid amount');
            return;
        }

        setIsDepositing(true);
        setStep('approving');

        try {
            await onDeposit(amount, network);
            onClose();
        } catch (error) {
            console.error('Deposit failed:', error);
            alert('Deposit failed. Please try again.');
        } finally {
            setIsDepositing(false);
            setStep('input');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit to Escrow</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Wallet Balance: <span className="font-semibold">${walletBalance.toFixed(2)} USDC</span>
                </p>

                {step === 'input' && (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USDC)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    step="0.01"
                                    max={walletBalance}
                                />
                            </div>

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
                                <button
                                    onClick={() => setAmount(walletBalance.toString())}
                                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                >
                                    Max
                                </button>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
                                <div className="flex items-start space-x-2">
                                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p>Funds deposited to escrow will be locked until you complete a withdrawal process.</p>
                                </div>
                            </div>
                        </div>

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
                                <span>Deposit</span>
                            </button>
                        </div>
                    </>
                )}

                {(step === 'approving' || step === 'depositing') && (
                    <div className="text-center py-8">
                        <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                            {step === 'approving' ? 'Approving Token...' : 'Depositing...'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {step === 'approving' 
                                ? 'Please confirm the approval transaction in your wallet' 
                                : 'Please confirm the deposit transaction in your wallet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}