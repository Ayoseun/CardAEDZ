import { EyeOff, Eye } from "lucide-react";

export function BalanceCard({ 
    title, 
    amount, 
    icon: Icon, 
    color, 
    showBalance, 
    onToggleBalance,
    chainBalances 
}: any) {
    const colorClasses: any = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600'
    };

    // Calculate total from chain balances if provided
    const hasChainData = chainBalances && Object.keys(chainBalances).length > 0;
    const totalBalance = hasChainData 
        ? Object.values(chainBalances).reduce((sum: number, chain: any) => {
            const chainTotal = chain.tokens.reduce((tokenSum: number, token: any) => 
                tokenSum + token.balance, 0
            );
            return sum + chainTotal;
        }, 0)
        : amount;

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
            
            <div className="text-3xl font-bold mb-4">
                {showBalance ? `$${totalBalance.toFixed(2)}` : '••••••'}
            </div>

            {/* Chain breakdown - only show for wallet balance with chain data */}
            {hasChainData && showBalance && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                    <p className="text-xs text-white text-opacity-70 mb-2">Balance by chain:</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(chainBalances).map((chain: any) => {
                            const chainTotal = chain.tokens.reduce((sum: number, token: any) => 
                                sum + token.balance, 0
                            );
                            
                            if (chainTotal < 0.01) return null;
                            
                            return (
                                <div 
                                    key={chain.chainId}
                                    className="flex items-center space-x-1 bg-white bg-opacity-10 rounded-lg px-2 py-1"
                                    title={`${chain.chainName}: $${chainTotal.toFixed(2)}`}
                                >
                                    {chain.iconUrl && (
                                        <img 
                                            src={chain.iconUrl} 
                                            alt={chain.chainName}
                                            className="w-4 h-4"
                                        />
                                    )}
                                    <span className="text-xs font-medium">
                                        ${chainTotal.toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Token breakdown */}
                    <div className="mt-3 space-y-1">
                        {Object.values(chainBalances).map((chain: any) => 
                            chain.tokens.map((token: any) => {
                                if (token.balance < 0.01) return null;
                                
                                return (
                                    <div 
                                        key={`${chain.chainId}-${token.address}`}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center space-x-1 text-white text-opacity-70">
                                            {chain.iconUrl && (
                                                <img 
                                                    src={chain.iconUrl} 
                                                    alt={chain.chainName}
                                                    className="w-3 h-3"
                                                />
                                            )}
                                            <span>{token.symbol}</span>
                                        </div>
                                        <span className="text-white text-opacity-90 font-medium">
                                            ${token.balance.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}