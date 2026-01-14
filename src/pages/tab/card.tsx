import React, { useState} from 'react';
import {
    Wallet, CreditCard, Copy,
    Check, 

    Loader,
    Plus,
} from 'lucide-react';



export function CardTab({ cardBalance, user }: any) {
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
        </div>
    );
}