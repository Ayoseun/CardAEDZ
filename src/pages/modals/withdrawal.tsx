import { useState, useEffect } from 'react';
import {
    ArrowUpRight,
    Loader,
    Clock, AlertCircle
} from 'lucide-react';


export function WithdrawModal({ onClose, maxAmount, escrowService, onWithdraw }: any) {
    const [amount, setAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [timelockInfo, setTimelockInfo] = useState<any>(null);

    useEffect(() => {
        if (escrowService) {
            checkTimelock();
        }
    }, [escrowService]);

    const checkTimelock = async () => {
        try {
            const tokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
            const info = await escrowService.getWithdrawalTimelock(tokenAddress);
            setTimelockInfo(info);
        } catch (error) {
            console.error('Error checking timelock:', error);
        }
    };

    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount) {
            alert('Invalid amount');
            return;
        }

        setIsWithdrawing(true);

        try {
            await onWithdraw(amount);
            onClose();
        } catch (error) {
            console.error('Withdrawal failed:', error);
            alert('Withdrawal initiation failed. Please try again.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Withdraw from Escrow</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Available: <span className="font-semibold">${maxAmount.toFixed(2)} USDC</span>
                </p>

                {timelockInfo && timelockInfo.isLocked && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-900">
                                <p className="font-semibold">Withdrawal Pending</p>
                                <p>Time remaining: {Math.floor(timelockInfo.remainingTime / 60)} minutes</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USDC)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            step="0.01"
                            max={maxAmount}
                        />
                    </div>

                    <div className="flex space-x-2">
                        {[25, 50, 100].map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setAmount(Math.min(preset, maxAmount).toString())}
                                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                            >
                                ${preset}
                            </button>
                        ))}
                        <button
                            onClick={() => setAmount(maxAmount.toString())}
                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                        >
                            Max
                        </button>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-900">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>Withdrawals require a timelock period. You'll need to initiate the withdrawal, wait for the timelock, then complete it.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isWithdrawing}
                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !amount}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isWithdrawing ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpRight className="w-4 h-4" />
                                <span>{timelockInfo?.isLocked ? 'Complete Withdrawal' : 'Initiate Withdrawal'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}