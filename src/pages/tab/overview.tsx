
import type { Transaction } from "../../utils/types";
import { TransactionItem } from "./items";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function OverviewTab({ transactions, cardBalance }: any) {
    const recentTransactions = transactions.slice(0, 5);

    // Generate balance history data (simulated - you'd get this from your backend)
    const balanceHistory = [
        { date: 'Jan 1', cardBalance: 150, walletBalance: 200, lockedBalance: 100 },
        { date: 'Jan 5', cardBalance: 180, walletBalance: 180, lockedBalance: 120 },
        { date: 'Jan 10', cardBalance: 200, walletBalance: 160, lockedBalance: 140 },
        { date: 'Jan 15', cardBalance: 170, walletBalance: 190, lockedBalance: 110 },
        { date: 'Jan 20', cardBalance: cardBalance, walletBalance: 220, lockedBalance: 130 },
    ];

    // Calculate transaction type breakdown
    const transactionBreakdown = [
        {
            type: 'Fund Wallet',
            count: transactions.filter((t: Transaction) => t.type === 'funding' && t.from === 'External').length,
            amount: transactions.filter((t: Transaction) => t.type === 'funding' && t.from === 'External' && t.status === 'completed').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            color: '#10b981'
        },
        {
            type: 'Fund Card',
            count: transactions.filter((t: Transaction) => t.type === 'funding' && t.from === 'Wallet').length,
            amount: transactions.filter((t: Transaction) => t.type === 'funding' && t.from === 'Wallet' && t.status === 'completed').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            color: '#6366f1'
        },
        {
            type: 'Withdrawal',
            count: transactions.filter((t: Transaction) => t.type === 'withdraw').length,
            amount: transactions.filter((t: Transaction) => t.type === 'withdraw' && t.status === 'completed').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            color: '#ef4444'
        },
        {
            type: 'Card Spending',
            count: transactions.filter((t: Transaction) => t.type === 'spend').length,
            amount: transactions.filter((t: Transaction) => t.type === 'spend' && t.status === 'completed').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            color: '#f59e0b'
        },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ${entry.value.toFixed(2)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const BarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.type}</p>
                    <p className="text-sm text-gray-700">Count: {payload[0].value}</p>
                    <p className="text-sm text-gray-700">Total: ${payload[0].payload.amount.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance History Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Balance History</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={balanceHistory}>
                            <defs>
                                <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="walletGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="lockedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="cardBalance" 
                                stroke="#6366f1" 
                                strokeWidth={2}
                                fill="url(#cardGradient)"
                                name="Card Balance"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="walletBalance" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                fill="url(#walletGradient)"
                                name="Wallet Balance"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="lockedBalance" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fill="url(#lockedGradient)"
                                name="Locked Balance"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Transaction Breakdown Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Transaction Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={transactionBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="type" 
                                tick={{ fontSize: 11 }}
                                stroke="#9ca3af"
                                angle={-15}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                stroke="#9ca3af"
                            />
                            <Tooltip content={<BarTooltip />} />
                            <Bar 
                                dataKey="count" 
                                fill="#6366f1"
                                radius={[8, 8, 0, 0]}
                                name="Transaction Count"
                            >
                                {transactionBreakdown.map((entry, index) => (
                                    <rect key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {transactionBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="text-xs">
                                    <p className="font-medium text-gray-900">{item.type}</p>
                                    <p className="text-gray-600">${item.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
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