import type { Transaction } from "../../utils/types";
import { TransactionItem } from "./items";
import {
   TrendingUp, History
} from 'lucide-react';


export function OverviewTab({ transactions, cardBalance }: any) {
    const recentTransactions = transactions.slice(0, 5);
    const totalSpent = transactions
        .filter((t: Transaction) => t.type === 'spend' && t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Spending This Month</h3>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                        ${totalSpent.toFixed(2)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((totalSpent / cardBalance) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Total Transactions</h3>
                        <History className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                        {transactions.length}
                    </div>
                    <p className="text-sm text-gray-600">
                        {transactions.filter((t: Transaction) => t.status === 'pending').length} pending
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentTransactions.map((tx: Transaction) => (
                        <TransactionItem key={tx.id} transaction={tx} />
                    ))}
                </div>
            </div>
        </div>
    );
}