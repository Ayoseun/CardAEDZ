import { useState, useEffect, useRef } from 'react';
import {
    Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, History,
    LogOut, Settings, Key, ShoppingCart
} from 'lucide-react';
import {
    useWeb3AuthConnect,
    useWeb3AuthDisconnect,
    useWeb3AuthUser,
} from "@web3auth/modal/react";
import { useSolanaWallet } from '@web3auth/modal/react/solana'
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { EscrowService } from '../constants/escrowContract';
import { ZERO_DEV_RPC_URL, ZERO_DEV_PASSKEY_SERVER_URL, MOCK_USDC_ADDRESS } from '../constants/config';
import { LoginScreen } from './login';
import { WithdrawModal } from './modals/withdrawal';
import { mockTransactions, type Transaction, type User } from '../utils/types';
import { TransactionsTab } from './tab/transactions';
import { OverviewTab } from './tab/overview';
import { CardTab } from './tab/card';
import { QuickAction } from '../components/quickAction';
import { BalanceCard } from '../components/balanceCard';

// ZeroDev imports for passkeys
import {
    toPasskeyValidator,
    toWebAuthnKey,
    WebAuthnMode,
    PasskeyValidatorContractVersion
} from "@zerodev/passkey-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
//import { createZeroDevPaymasterClient } from "@zerodev/sdk";
import { TopUpModal } from './modals/topUpModal';

// Configuration
const CHAIN = baseSepolia;
const entryPoint = getEntryPoint("0.7");
const HARDCODED_SPEND_AMOUNT = "25.00"; // $25 per transaction

export default function Dashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [showFundWalletModal, setShowFundWalletModal] = useState(false);
    const [showTopUpCardModal, setShowTopUpCardModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [cardBalance, setCardBalance] = useState(0.00);
    const [walletBalance, setWalletBalance] = useState(0.00);
    const [monthlySpent, setMonthlySpent] = useState(0.00);
    const [isSpending, setIsSpending] = useState(false);
    const [escrowService, setEscrowService] = useState<any>(null);
    //@ts-ignore
    const { solanaWallet, connection } = useSolanaWallet()
    
    // ZeroDev states
    const [kernelAccount, setKernelAccount] = useState<any>(null);
    const [kernelClient, setKernelClient] = useState<any>(null);
    const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
    const [passkeyCreated, setPasskeyCreated] = useState(false);
    const loginAttemptedRef = useRef(false);
    const { connect, isConnected } = useWeb3AuthConnect();
    const { disconnect } = useWeb3AuthDisconnect();
    const { userInfo } = useWeb3AuthUser();

    const publicClient = createPublicClient({
        transport: http(ZERO_DEV_RPC_URL),
        chain: CHAIN,
    });

    useEffect(() => {
        if (isConnected && userInfo && !loginAttemptedRef.current) {
            setIsAuthenticated(true);
            setUser({
                name: userInfo.name || 'User',
                email: userInfo.email || '',
                walletAddress: kernelAccount?.address || '',
                avatar: userInfo.profileImage || ''
            } as any);

            const hasPasskey = localStorage.getItem(`passkey_created_${"userInfo.email"}`);
            if (hasPasskey === 'true') {
                setPasskeyCreated(true);
                loginAttemptedRef.current = true;
                loginWithPasskey();
            }
        }
    }, [isConnected, userInfo, kernelAccount]);

    // Create passkey wallet after Web3Auth login
    const createPasskeyWallet = async () => {
        if (!isConnected) return;

        console.log("Creating passkey wallet...");
        setIsCreatingPasskey(true);
        try {
            const webAuthnKey = await toWebAuthnKey({
                passkeyName: "userInfo.email",
                passkeyServerUrl: ZERO_DEV_PASSKEY_SERVER_URL,
                mode: WebAuthnMode.Register,
                passkeyServerHeaders: {}
            });

            const passkeyValidator = await toPasskeyValidator(publicClient, {
                webAuthnKey,
                entryPoint,
                kernelVersion: KERNEL_V3_1,
                validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED
            });

            const account = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: passkeyValidator,
                },
                entryPoint,
                kernelVersion: KERNEL_V3_1
            });

            const client = createKernelAccountClient({
                account,
                chain: CHAIN,
                bundlerTransport: http(ZERO_DEV_RPC_URL),
                client: publicClient,
            });

            setKernelAccount(account);
            setKernelClient(client);

            const service = new EscrowService(client, account.address);
            setEscrowService(service);

            localStorage.setItem(`passkey_created_${"userInfo.email"}`, 'true');
            setPasskeyCreated(true);

            await loadBalances(service);

            alert('Passkey wallet created successfully! Your wallet address: ' + account.address);
        } catch (error) {
            console.error("Failed to create passkey wallet:", error);
            alert('Failed to create passkey wallet. Please try again.');
        } finally {
            setIsCreatingPasskey(false);
        }
    };

    // Login with existing passkey
    const loginWithPasskey = async () => {
        if (!isConnected) return;
        console.log("Logging in with existing passkey...");
        setIsLoading(true);
        try {
            const webAuthnKey = await toWebAuthnKey({
                passkeyName: "userInfo.email",
                passkeyServerUrl: ZERO_DEV_PASSKEY_SERVER_URL,
                mode: WebAuthnMode.Login,
                passkeyServerHeaders: {}
            });

            const passkeyValidator = await toPasskeyValidator(publicClient, {
                webAuthnKey,
                entryPoint,
                kernelVersion: KERNEL_V3_1,
                validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED
            });

            const account = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: passkeyValidator,
                },
                entryPoint,
                kernelVersion: KERNEL_V3_1
            });

            const client = createKernelAccountClient({
                account,
                chain: CHAIN,
                bundlerTransport: http(ZERO_DEV_RPC_URL),
                client: publicClient,
            });

            setKernelAccount(account);
            setKernelClient(client);

            const service = new EscrowService(client, account.address);
            setEscrowService(service);

            await loadBalances(service);
        } catch (error) {
            console.error("Failed to login with passkey:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadBalances = async (service?: any) => {
        const svc = service || escrowService;
        if (!svc) return;

        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            const balance = await svc.getEscrowBalance(tokenAddress);
            setCardBalance(parseFloat(balance));

            const walletBal = await svc.getTokenBalance(tokenAddress);
            setWalletBalance(parseFloat(walletBal));

            // Load spending data
            const spendData = await svc.getSpendProofs(tokenAddress);
            setMonthlySpent(parseFloat(spendData.monthlySpent));
        } catch (error) {
            console.error("Error loading balances:", error);
        }
    };

    const handleSpend = async () => {
        if (!escrowService) {
            alert('Escrow service not initialized');
            return;
        }

        const spendAmount = parseFloat(HARDCODED_SPEND_AMOUNT);
        if (cardBalance < spendAmount) {
            alert('Insufficient card balance');
            return;
        }

        setIsSpending(true);
        const txId = Date.now().toString();

        // Add pending transaction
        setTransactions([
            {
                id: txId,
                type: 'spend',
                amount: spendAmount,
                to: 'Merchant',
                status: 'pending',
                date: new Date().toISOString(),
                network: 'Base'
            },
            ...transactions
        ]);

        try {
            const tokenAddress = MOCK_USDC_ADDRESS;
            
            // Report spend to smart contract
            const receipt = await escrowService.reportSpend(tokenAddress, HARDCODED_SPEND_AMOUNT);
            console.log('Spend reported:', receipt);

            // Update transaction status
            setTransactions(prev =>
                prev.map(tx => tx.id === txId
                    ? { ...tx, status: 'completed', txHash: receipt.transactionHash }
                    : tx
                )
            );

            // Optimistically update balances
            setCardBalance(prev => prev - spendAmount);
            setMonthlySpent(prev => prev + spendAmount);

            // Reload balances from contract
            await loadBalances();

            alert(`Successfully spent $${HARDCODED_SPEND_AMOUNT}!`);
        } catch (error) {
            console.error("Spend failed:", error);
            
            // Update transaction status to failed
            setTransactions(prev =>
                prev.map(tx => tx.id === txId ? { ...tx, status: 'failed' } : tx)
            );
            
            alert('Failed to process spend. Please try again.');
        } finally {
            setIsSpending(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        if (userInfo) {
            await disconnect();
        }
        setUser(null);
        setIsAuthenticated(false);
        setEscrowService(null);
        setKernelAccount(null);
        setKernelClient(null);
        setPasskeyCreated(false);
        setIsLoading(false);
    };

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await connect();
        } catch (error) {
            console.error("Login failed:", error);
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} isLoading={isLoading} />;
    }

    // Show passkey creation prompt if user hasn't created one yet
    if (isAuthenticated && !passkeyCreated && !isCreatingPasskey) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Passkey Wallet</h2>
                        <p className="text-gray-600">
                            Secure your funds with a passkey - no seed phrases needed!
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Biometric Security</p>
                                <p className="text-sm text-gray-600">Use Face ID, Touch ID, or your device's security</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">No Seed Phrases</p>
                                <p className="text-sm text-gray-600">Your passkey is stored securely on your device</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Gasless Transactions</p>
                                <p className="text-sm text-gray-600">We sponsor your gas fees</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={createPasskeyWallet}
                        disabled={isCreatingPasskey}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreatingPasskey ? 'Creating Wallet...' : 'Create Passkey Wallet'}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-3 text-gray-600 font-medium py-2 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Calculate spending progress (assuming $500 monthly limit)
    const monthlyLimit = 500;
    const spendingProgress = (monthlySpent / monthlyLimit) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AEDZ Pay</h1>
                                <p className="text-xs text-gray-500">Self-custodial spending</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {kernelAccount && (
                                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                                    <Key className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-mono text-indigo-900">
                                        {kernelAccount.address.slice(0, 6)}...{kernelAccount.address.slice(-4)}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <BalanceCard
                        title="Card Balance"
                        amount={cardBalance}
                        icon={CreditCard}
                        color="indigo"
                        showBalance={showBalance}
                        onToggleBalance={async() => {
                           await loadBalances();
                            setShowBalance(!showBalance)
                        }}
                    />
                     
                    <BalanceCard
                        title="Wallet Balance"
                        amount={walletBalance}
                        icon={Wallet}
                        color="pink"
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
                    />

                    {/* Spending Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <ShoppingCart className="w-5 h-5 text-orange-600" />
                                <span className="font-medium text-gray-900">This Month</span>
                            </div>
                            <span className="text-sm text-gray-500">${monthlyLimit} limit</span>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-3xl font-bold text-gray-900">
                                    ${monthlySpent.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {spendingProgress.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(spendingProgress, 100)}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            ${(monthlyLimit - monthlySpent).toFixed(2)} remaining
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <QuickAction
                        icon={ArrowDownLeft}
                        label="Fund Wallet"
                        onClick={() => {
                            console.log("Funding wallet...");
                            setShowFundWalletModal(true)
                        }}
                        color="green"
                    />
                    <QuickAction
                        icon={ArrowUpRight}
                        label="Withdraw"
                        onClick={() => setShowWithdrawModal(true)}
                        color="red"
                    />

                    <QuickAction
                        icon={CreditCard}
                        label="Get Card"
                        onClick={() => setActiveTab('card')}
                        color="indigo"
                    />
                    
                    {/* Spend Button */}
                    <button
                        onClick={handleSpend}
                        disabled={isSpending || cardBalance < parseFloat(HARDCODED_SPEND_AMOUNT)}
                        className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            {isSpending ? 'Processing...' : `Spend $${HARDCODED_SPEND_AMOUNT}`}
                        </span>
                    </button>

                    <QuickAction
                        icon={History}
                        label="History"
                        onClick={() => setActiveTab('transactions')}
                        color="purple"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex space-x-1 p-2">
                        {['overview', 'transactions', 'card', 'profile'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="transition-all duration-300">
                    {activeTab === 'overview' && (
                        <OverviewTab transactions={transactions} cardBalance={cardBalance} />
                    )}
                    {activeTab === 'transactions' && (
                        <TransactionsTab transactions={transactions} />
                    )}
                    {activeTab === 'card' && (
                        <CardTab
                            cardBalance={cardBalance}
                            user={user}
                            onTopUp={() => setShowTopUpCardModal(true)}
                        />
                    )}
                </div>
            </div>

            {showFundWalletModal && kernelClient && (
                <TopUpModal
                    onClose={() => setShowFundWalletModal(false)}
                    walletBalance={walletBalance}
                    mode="fund"
                    address={kernelAccount.address}
                />
            )}

            {showTopUpCardModal && kernelClient && (
                <TopUpModal
                    onClose={() => setShowTopUpCardModal(false)}
                    walletBalance={walletBalance}
                    address={kernelAccount.address}
                    onDeposit={async (amount: any, network: any) => {
                        const txId = Date.now().toString();
                        setTransactions([
                            {
                                id: txId,
                                type: 'funding',
                                amount: parseFloat(amount),
                                from: 'Wallet',
                                status: 'pending',
                                date: new Date().toISOString(),
                                network
                            },
                            ...transactions
                        ]);

                        try {
                            if (escrowService) {
                                const tokenAddress = MOCK_USDC_ADDRESS;
                                const receipt = await escrowService.depositToEscrow(tokenAddress, amount, 0, 0);

                                setTransactions(prev =>
                                    prev.map(tx => tx.id === txId
                                        ? { ...tx, status: 'completed', txHash: receipt.transactionHash }
                                        : tx
                                    )
                                );

                                await loadBalances();
                            }
                        } catch (error) {
                            console.error("Deposit failed:", error);
                            setTransactions(prev =>
                                prev.map(tx => tx.id === txId ? { ...tx, status: 'failed' } : tx)
                            );
                        }
                    }}
                />
            )}

            {showWithdrawModal && (
                <WithdrawModal
                    onClose={() => setShowWithdrawModal(false)}
                    maxAmount={cardBalance}
                    escrowService={escrowService}
                    onWithdrawComplete={async (withdrawnAmount: string) => {
                        const amount = parseFloat(withdrawnAmount);
                        
                        if (isNaN(amount) || amount <= 0) {
                            console.error('Invalid withdrawal amount:', withdrawnAmount);
                            return;
                        }

                        const txId = Date.now().toString();
                        
                        setTransactions([
                            {
                                id: txId,
                                type: 'withdraw',
                                amount: amount,
                                to: 'Wallet',
                                status: 'completed',
                                date: new Date().toISOString(),
                                network: 'Base'
                            },
                            ...transactions
                        ]);

                        try {
                            await loadBalances();
                        } catch (error) {
                            console.error("Failed to refresh balances:", error);
                        }
                    }}
                />
            )}
        </div>
    );
}