
import  { useState} from 'react';

import type { Transaction } from '../../utils/types';
import { TransactionItem } from './items';



export function TransactionsTab({ transactions }: any) {
    const [filter, setFilter] = useState('all');

    const filteredTransactions = transactions.filter((tx: Transaction) => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Transaction History</h3>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Transactions</option>
                        <option value="spend">Spending</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdraw">Withdrawals</option>
                    </select>
                </div>
            </div>
            <div className="divide-y divide-gray-200">
                {filteredTransactions.map((tx: Transaction) => (
                    <TransactionItem key={tx.id} transaction={tx} detailed />
                ))}
            </div>
        </div>
    );
}