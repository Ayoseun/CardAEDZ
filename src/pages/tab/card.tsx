import { useState } from 'react';
import {
    Wallet, CreditCard, Copy,
    Check, 
    Loader,
    Plus,
    ArrowDownLeft
} from 'lucide-react';

export function CardTab({ cardBalance, user, onTopUp }: any) {
    const [copied, setCopied] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [cardIssued, setCardIssued] = useState(false);

    const cardNumber = '4532 •••• •••• 7890';

    const handleIssueCard = () => {
        setIssuing(true);
        setTimeout(() => {
            setIssuing(false);
            setCardIssued(true);
        }, 3000);
    };

    const copyCardNumber = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center space-x-2">
                            <Wallet className="w-6 h-6" />
                            <span className="font-semibold">AEDZ Pay</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Balance</p>
                            <p className="text-2xl font-bold">${cardBalance.toFixed(2)}</p>
                        </div>
                    </div>

                    {cardIssued ? (
                        <>
                            <div className="mb-8">
                                <p className="text-xs text-gray-400 mb-2">Card Number</p>
                                <div className="flex items-center space-x-3">
                                    <p className="text-2xl font-mono tracking-wider">{cardNumber}</p>
                                    <button
                                        onClick={copyCardNumber}
                                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Cardholder</p>
                                    <p className="font-semibold">{user?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 mb-1">Expires</p>
                                    <p className="font-semibold">12/28</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 mb-1">CVV</p>
                                    <p className="font-semibold">•••</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">No Card Issued Yet</p>
                            <p className="text-sm text-gray-400 mb-6">Issue your virtual card to start spending</p>
                            <button
                                onClick={handleIssueCard}
                                disabled={issuing}
                                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
                            >
                                {issuing ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Issuing Card...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Issue Virtual Card</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {cardIssued && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={onTopUp}
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md"
                        >
                            <ArrowDownLeft className="w-5 h-5" />
                            <span>Top Up Card</span>
                        </button>
                        <button
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                        >
                            <CreditCard className="w-5 h-5" />
                            <span>Freeze Card</span>
                        </button>
                    </div>
                </div>
            )}

            {cardIssued && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Card Transactions</h3>
                    <div className="space-y-3">
                        {[
                            { merchant: 'Amazon', amount: 45.99, date: '2 hours ago', status: 'completed' },
                            { merchant: 'Uber', amount: 12.50, date: 'Yesterday', status: 'completed' },
                            { merchant: 'Netflix', amount: 15.99, date: '3 days ago', status: 'completed' },
                        ].map((tx, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{tx.merchant}</p>
                                        <p className="text-sm text-gray-500">{tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">-${tx.amount}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}