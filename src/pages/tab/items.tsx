import React, { useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    DollarSign,
    CheckCircle, AlertCircle,
    Clock,
} from 'lucide-react';



export function TransactionItem({ transaction, detailed = false }: any) {
    const getIcon = () => {
        switch (transaction.type) {
            case 'spend':
                return <ArrowUpRight className="w-5 h-5 text-red-600" />;
            case 'deposit':
                return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
            case 'withdraw':
                return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
            default:
                return <DollarSign className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusBadge = () => {
        if (transaction.status === 'completed') {
            return (
                <span className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Completed</span>
                </span>
            );
        }
        if (transaction.status === 'failed') {
            return (
                <span className="flex items-center space-x-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Failed</span>
                </span>
            );
        }
        return (
            <span className="flex items-center space-x-1 text-xs text-yellow-600">
                <Clock className="w-3 h-3 animate-spin" />
                <span>Pending</span>
            </span>
        );
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getIcon()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {transaction.type === 'spend' && transaction.merchant}
                            {transaction.type === 'deposit' && `Deposit from ${transaction.from}`}
                            {transaction.type === 'withdraw' && `Withdraw to ${transaction.to}`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{new Date(transaction.date).toLocaleString()}</span>
                            {detailed && (
                                <>
                                    <span>•</span>
                                    <span className="text-indigo-600">{transaction.network}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'spend' || transaction.type === 'withdraw'
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {transaction.type === 'spend' || transaction.type === 'withdraw' ? '-' : '+'}
                        ${transaction.amount.toFixed(2)}
                    </p>
                    {getStatusBadge()}
                </div>
            </div>
        </div>
    );
}