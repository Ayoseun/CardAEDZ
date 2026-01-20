import { useState, useEffect } from 'react';
import {
    ArrowUpRight,
    Loader,
    Clock,
    AlertCircle,
    X
} from 'lucide-react';
import { MOCK_USDC_ADDRESS } from '../../constants/config';

export function WithdrawModal({ onClose, maxAmount, escrowService, onWithdrawComplete }: any) {
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [timelockInfo, setTimelockInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (escrowService) {
            checkTimelock();
        }
    }, [escrowService]);

    const checkTimelock = async () => {
        setIsLoading(true);
        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            const info = await escrowService.getWithdrawalTimelock(tokenAddress);
            setTimelockInfo(info);
        } catch (error) {
            console.error('Error checking timelock:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitiateWithdrawal = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount) {
            alert('Invalid amount');
            return;
        }

        setIsProcessing(true);

        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            await escrowService.initiateWithdrawal(tokenAddress, amount);
            
            // Refresh timelock info
            await checkTimelock();
            
            alert('Withdrawal initiated! Please wait for the timelock period to expire.');
            
            // Clear the amount input after successful initiation
            setAmount('');
        } catch (error) {
            console.error('Initiate withdrawal failed:', error);
            alert('Failed to initiate withdrawal. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompleteWithdrawal = async () => {
        setIsProcessing(true);

        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            const withdrawAmount = timelockInfo?.pendingAmount || '0';
            
            // Complete the withdrawal
            await escrowService.completeWithdrawal(tokenAddress);
            
            alert('Withdrawal completed successfully!');
            
            // Call parent callback with the withdrawn amount
            if (onWithdrawComplete) {
                await onWithdrawComplete(withdrawAmount);
            }
            
            // Close modal after successful completion
            onClose();
        } catch (error) {
            console.error('Complete withdrawal failed:', error);
            alert('Failed to complete withdrawal. Please try again.');
            setIsProcessing(false);
        }
    };

    const handleCancelWithdrawal = async () => {
        setIsProcessing(true);

        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            await escrowService.cancelWithdrawal(tokenAddress);
            
            // Refresh timelock info
            await checkTimelock();
            
            alert('Withdrawal cancelled successfully!');
        } catch (error) {
            console.error('Cancel withdrawal failed:', error);
            alert('Failed to cancel withdrawal. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const hasPendingWithdrawal = timelockInfo && parseFloat(timelockInfo.pendingAmount) > 0;
    const canComplete = hasPendingWithdrawal && !timelockInfo.isLocked;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Withdraw from Escrow</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Available: <span className="font-semibold">${maxAmount.toFixed(2)} USDC</span>
                </p>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* Pending Withdrawal Warning */}
                        {hasPendingWithdrawal && (
                            <div className={`border rounded-lg p-3 mb-4 ${
                                timelockInfo.isLocked 
                                    ? 'bg-yellow-50 border-yellow-200' 
                                    : 'bg-green-50 border-green-200'
                            }`}>
                                <div className="flex items-start space-x-2">
                                    <Clock className={`w-4 h-4 mt-0.5 ${
                                        timelockInfo.isLocked ? 'text-yellow-600' : 'text-green-600'
                                    }`} />
                                    <div className="text-sm">
                                        <p className="font-semibold">
                                            {timelockInfo.isLocked ? 'Withdrawal Pending' : 'Withdrawal Ready!'}
                                        </p>
                                        <p className="text-gray-700">
                                            Amount: ${parseFloat(timelockInfo.pendingAmount).toFixed(2)} USDC
                                        </p>
                                        {timelockInfo.isLocked ? (
                                            <p className="text-gray-700">
                                                Time remaining: {Math.floor(timelockInfo.remainingTime / 60)} minutes
                                            </p>
                                        ) : (
                                            <p className="text-green-700 font-medium">
                                                You can now complete your withdrawal!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show form only if no pending withdrawal */}
                        {!hasPendingWithdrawal && (
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
                                        <p>
                                            Withdrawals are a 2-step process:
                                            <br />
                                            1. Initiate withdrawal (starts timelock)
                                            <br />
                                            2. Wait for timelock to expire
                                            <br />
                                            3. Complete withdrawal to receive funds
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            {hasPendingWithdrawal ? (
                                <>
                                    <button
                                        onClick={handleCancelWithdrawal}
                                        disabled={isProcessing}
                                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Cancel Withdrawal
                                    </button>
                                    <button
                                        onClick={handleCompleteWithdrawal}
                                        disabled={isProcessing || timelockInfo.isLocked}
                                        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400 flex items-center space-x-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span>Complete Withdrawal</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onClose}
                                        disabled={isProcessing}
                                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInitiateWithdrawal}
                                        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                                        className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span>Initiate Withdrawal</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}