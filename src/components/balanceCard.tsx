

import { EyeOff, Eye } from "lucide-react";
export function BalanceCard({ title, amount, icon: Icon, color, showBalance, onToggleBalance }: any) {
    const colorClasses:any = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{title}</span>
                </div>
                {onToggleBalance && (
                    <button
                        onClick={onToggleBalance}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                )}
            </div>
            <div className="text-3xl font-bold">
                {showBalance ? `$${amount.toFixed(2)}` : '••••••'}
            </div>
        </div>
    );
}
