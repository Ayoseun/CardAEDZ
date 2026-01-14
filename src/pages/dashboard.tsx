import { useState, useEffect } from 'react';
import {
    Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, History,
    LogOut, Settings, Lock, Key
} from 'lucide-react';
import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
  useWeb3Auth
} from "@web3auth/modal/react";
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { EscrowService } from '../constants/escrowContract';
import { BASE_USDC_ADDRESS } from '../constants/config';
import { LoginScreen } from './login';
import { DepositModal } from './modals/deposit';
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
import { createZeroDevPaymasterClient } from "@zerodev/sdk";

// Configuration - Replace with your actual values
const ZERODEV_RPC = "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID";
const PASSKEY_SERVER_URL = "https://passkeys.zerodev.app/api/v3/YOUR_PROJECT_ID";
const CHAIN = baseSepolia;
const entryPoint = getEntryPoint("0.7");

export default function Dashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [cardBalance] = useState(487.51);
    const [escrowBalance, setEscrowBalance] = useState(0);
    const [walletBalance, setWalletBalance] = useState(1250.00);
    const [escrowService, setEscrowService] = useState<any>(null);
    
    // ZeroDev states
    const [kernelAccount, setKernelAccount] = useState<any>(null);
    const [kernelClient, setKernelClient] = useState<any>(null);
    const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
    const [passkeyCreated, setPasskeyCreated] = useState(false);

    const { connect, isConnected, } = useWeb3AuthConnect();
    const { disconnect } = useWeb3AuthDisconnect();
    const { userInfo } = useWeb3AuthUser();
    const { provider } = useWeb3Auth();

    const publicClient = createPublicClient({
        transport: http(ZERODEV_RPC),
        chain: CHAIN,
    });

    // Handle Web3Auth authentication
    useEffect(() => {
        if (isConnected && userInfo) {
            setIsAuthenticated(true);
            setUser({
                name: userInfo.name || 'User',
                email: userInfo.email || '',
                walletAddress: kernelAccount?.address || '',
                avatar: userInfo.profileImage || ''
            } as any);
            
            // Check if user already has a passkey wallet
            const hasPasskey = localStorage.getItem(`passkey_created_${userInfo.email}`);
            if (hasPasskey === 'true') {
                setPasskeyCreated(true);
                // Auto-login with existing passkey
                loginWithPasskey();
            }
        }
    }, [isConnected, userInfo, kernelAccount]);

    // Create passkey wallet after Web3Auth login
    const createPasskeyWallet = async () => {
        if (!userInfo?.email) return;
        
        setIsCreatingPasskey(true);
        try {
            // Create a new passkey
            const webAuthnKey = await toWebAuthnKey({
                passkeyName: userInfo.email,
                passkeyServerUrl: PASSKEY_SERVER_URL,
                mode: WebAuthnMode.Register,
                passkeyServerHeaders: {}
            });

            // Create passkey validator
            const passkeyValidator = await toPasskeyValidator(publicClient, {
                webAuthnKey,
                entryPoint,
                kernelVersion: KERNEL_V3_1,
                validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED
            });

            // Create Kernel account with passkey validator
            const account = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: passkeyValidator,
                },
                entryPoint,
                kernelVersion: KERNEL_V3_1
            });

            // Create Kernel client with paymaster for gasless transactions
            const client:any = createKernelAccountClient({
                account,
                chain: CHAIN,
                bundlerTransport: http(ZERODEV_RPC),
                client: publicClient,
                paymaster: {
                    getPaymasterData: async (userOperation) => {
                        const zerodevPaymaster = createZeroDevPaymasterClient({
                            chain: CHAIN,
                            transport: http(ZERODEV_RPC),
                        });
                        return zerodevPaymaster.sponsorUserOperation({
                            userOperation,
                        });
                    }
                },
            });

            setKernelAccount(account);
            setKernelClient(client);
            
            // Initialize escrow service with the new account
            const service = new EscrowService(client);
            setEscrowService(service);
            
            // Mark passkey as created
            localStorage.setItem(`passkey_created_${userInfo.email}`, 'true');
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
        if (!userInfo?.email) return;
        
        setIsLoading(true);
        try {
            // Login with existing passkey
            const webAuthnKey = await toWebAuthnKey({
                passkeyName: userInfo.email,
                passkeyServerUrl: PASSKEY_SERVER_URL,
                mode: WebAuthnMode.Login,
                passkeyServerHeaders: {}
            });

            // Create passkey validator
            const passkeyValidator = await toPasskeyValidator(publicClient, {
                webAuthnKey,
                entryPoint,
                kernelVersion: KERNEL_V3_1,
                validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED
            });

            // Recreate Kernel account
            const account = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: passkeyValidator,
                },
                entryPoint,
                kernelVersion: KERNEL_V3_1
            });

            // Recreate Kernel client
            const client = createKernelAccountClient({
                account,
                chain: CHAIN,
                bundlerTransport: http(ZERODEV_RPC),
                client: publicClient,
                paymaster: {
                    getPaymasterData: async (userOperation) => {
                        const zerodevPaymaster = createZeroDevPaymasterClient({
                            chain: CHAIN,
                            transport: http(ZERODEV_RPC),
                        });
                        return zerodevPaymaster.sponsorUserOperation({
                            userOperation,
                        });
                    }
                },
            });

            setKernelAccount(account);
            setKernelClient(client);
            
            // Initialize escrow service
            const service = new EscrowService(provider!);
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
            const tokenAddress = BASE_USDC_ADDRESS;
            const balance = await svc.getEscrowBalance(tokenAddress);
            setEscrowBalance(parseFloat(balance));
            
            const walletBal = await svc.getTokenBalance(tokenAddress);
            setWalletBalance(parseFloat(walletBal));
        } catch (error) {
            console.error("Error loading balances:", error);
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
                        onToggleBalance={() => setShowBalance(!showBalance)}
                    />
                    <BalanceCard
                        title="Escrow Balance"
                        amount={escrowBalance}
                        icon={Lock}
                        color="purple"
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
                    />
                    <BalanceCard
                        title="Wallet Balance"
                        amount={walletBalance}
                        icon={Wallet}
                        color="pink"
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <QuickAction
                        icon={ArrowDownLeft}
                        label="Deposit"
                        onClick={() => setShowDepositModal(true)}
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
                        <CardTab cardBalance={cardBalance} user={user} />
                    )}
                </div>
            </div>

            {showDepositModal && kernelClient && (
                <DepositModal
                    onClose={() => setShowDepositModal(false)}
                    walletBalance={walletBalance}
                    onDeposit={async (amount:any, network:any) => {
                        const txId = Date.now().toString();
                        setTransactions([
                            {
                                id: txId,
                                type: 'deposit',
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
                                const tokenAddress = BASE_USDC_ADDRESS;
                                const receipt = await escrowService.depositToEscrow(tokenAddress, amount);
                                
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
                    maxAmount={escrowBalance}
                    escrowService={escrowService}
                    onWithdraw={async (amount:any) => {
                        const txId = Date.now().toString();
                        setTransactions([
                            {
                                id: txId,
                                type: 'withdraw',
                                amount: parseFloat(amount),
                                to: 'Wallet',
                                status: 'pending',
                                date: new Date().toISOString(),
                                network: 'Base'
                            },
                            ...transactions
                        ]);

                        try {
                            if (escrowService) {
                                const tokenAddress = BASE_USDC_ADDRESS;
                                const receipt = await escrowService.initiateWithdrawal(tokenAddress, amount);
                                
                                setTransactions(prev => 
                                    prev.map(tx => tx.id === txId 
                                        ? { ...tx, status: 'completed', txHash: receipt.transactionHash }
                                        : tx
                                    )
                                );
                                
                                await loadBalances();
                            }
                        } catch (error) {
                            console.error("Withdrawal failed:", error);
                            setTransactions(prev => 
                                prev.map(tx => tx.id === txId ? { ...tx, status: 'failed' } : tx)
                            );
                        }
                    }}
                />
            )}
        </div>
    );
}