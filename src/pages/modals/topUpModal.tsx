import { useState, useEffect } from 'react';
import {
    ArrowDownLeft,
    Loader,
    Lock,
    Wallet,
    Copy,
    Check,
    QrCode,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { CUSTOM_CHAINS, PREFERRED_CHAINS, BASE_CHAIN_ID, RELAY_API_BASE, RELAY_TESTNETS_API, MOCK_USDC_ADDRESS } from '../../constants/config';
import { baseSepolia, hyperliquidEvmTestnet, sepolia, tempoLocalnet } from 'viem/chains';
import { createPublicClient, formatEther, http } from 'viem';


export default function TopUpModal({
    onClose,
    onDeposit,
    mode = 'topup',
    address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    kernelClient,
    customChains = CUSTOM_CHAINS, // Add customChains prop
    escrowService
}: any) {
    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('EVM');
    const [selectedChain, setSelectedChain]: any = useState(BASE_CHAIN_ID);
    const [selectedToken, setSelectedToken]: any = useState(null);
    const [isDepositing, setIsDepositing] = useState(false);
    const [step, setStep] = useState('input');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [relayQuote, setRelayQuote]: any = useState({});
    const [bridgeStatus, setBridgeStatus] = useState('');
    const [requestId, setRequestId] = useState('');
    const [estimatedFees, setEstimatedFees]: any = useState(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0.00);
    // Chain and token data
    const [chains, setChains] = useState([]);
    const [isLoadingChains, setIsLoadingChains] = useState(true);
    const [availableTokens, setAvailableTokens] = useState([]);

    const isTopUpMode = mode === 'topup';
    const isFundMode = mode === 'fund';
    const needsBridge = (selectedChain !== 84532 || (selectedToken?.symbol?.toUpperCase() !== 'USDC'));

    const evmAddress = address;
    const solanaAddress = 'Sol...';

    // Fetch chains from Relay API
    useEffect(() => {
        fetchChains();
    }, []);

    // Update available tokens when chain changes
    useEffect(() => {
        if (selectedChain && chains.length > 0) {
            const chain: any = chains.find((c: any) => c.id === selectedChain);
            if (chain) {
                const tokens: any = [
                    chain.currency,
                    ...(chain.erc20Currencies || [])
                ].filter(t => isTopUpMode ? t.supportsBridging : true); // For fund mode, show all tokens

                setAvailableTokens(tokens);

                // Auto-select USDC if available, otherwise first token
                const usdcToken = tokens.find((t: any) =>
                    t.symbol.toUpperCase() === 'USDC' ||
                    t.id === 'usdc'
                );
                console.log("Auto-selecting token:", usdcToken || tokens[0]);
                setSelectedToken(usdcToken || tokens[0]);
            }

        }
    }, [selectedChain, chains, isTopUpMode]);
    useEffect(() => {
        if (!selectedToken || !escrowService) return;
        if (selectedToken.symbol
            == 'ETH') {
            console.log("Getting  chain:", selectedToken, selectedChain, selectedChainData)
            switch (selectedChain) {
                case 11155111:
                    getNativeBalance(sepolia, selectedChainData.httpRpcUrl);
                    break;
                case 84532:
                    getNativeBalance(baseSepolia, selectedChainData.httpRpcUrl);
                    break;
                case 42431:
                    getNativeBalance(tempoLocalnet, selectedChainData.httpRpcUrl);
                    break;
                case 1337:
                    getNativeBalance(hyperliquidEvmTestnet, selectedChainData.httpRpcUrl);
                    break;
                default:
                    //getNativeBalance(baseSepolia, selectedChainData.httpRpcUrl);
                    setWalletBalance(0.00);
                    break;
            }
        } else {
            loadSelectedTokenBalance(selectedToken);
        }

    }, [selectedToken]);



    const getNativeBalance = async (
        chain: any,
        rpcUrl: string,
    ) => {
        try {
            const publicClient = createPublicClient({
                chain,
                transport: http(rpcUrl),
            });

            const rawBalance = await publicClient.getBalance({
                address: address,
            });

            const formatted = Number(formatEther(rawBalance));

            // Explicit, predictable precision rule
            const display =
                formatted >= 1
                    ? formatted.toFixed(2)
                    : formatted.toFixed(6);

            setWalletBalance(Number(display));
        } catch (error) {
            console.error('Failed to fetch native balance:', error);
            setWalletBalance(0);
        }
    };


    const fetchChains = async () => {
        setIsLoadingChains(true);
        try {
            const response = await fetch(`${RELAY_TESTNETS_API}/chains`);
            const data = await response.json();

            // Filter and sort chains by preference
            const supportedChains = data.chains
                .filter((chain: any) =>
                    chain.depositEnabled &&
                    chain.vmType === 'evm' &&
                    !chain.disabled
                )
                .sort((a: any, b: any) => {
                    const aIndex = PREFERRED_CHAINS.findIndex(p =>
                        a.name.toLowerCase().includes(p) ||
                        a.displayName.toLowerCase().includes(p)
                    );
                    const bIndex = PREFERRED_CHAINS.findIndex(p =>
                        b.name.toLowerCase().includes(p) ||
                        b.displayName.toLowerCase().includes(p)
                    );

                    if (aIndex === -1 && bIndex === -1) return 0;
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                });

            // Merge custom chains with API chains
            // Custom chains go at the end unless they match preferred chains
            const mergedChains = [...supportedChains, ...customChains].reduce((acc, chain) => {
                // Avoid duplicates based on chain ID
                if (!acc.find((c: any) => c.id === chain.id)) {
                    acc.push(chain);
                }
                return acc;
            }, []);

            // Re-sort after merging to respect PREFERRED_CHAINS order
            const finalChains = mergedChains.sort((a: any, b: any) => {
                const aIndex = PREFERRED_CHAINS.findIndex(p =>
                    a.name.toLowerCase().includes(p) ||
                    a.displayName.toLowerCase().includes(p)
                );
                const bIndex = PREFERRED_CHAINS.findIndex(p =>
                    b.name.toLowerCase().includes(p) ||
                    b.displayName.toLowerCase().includes(p)
                );

                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });

            setChains(finalChains);

            // Set initial chain to Base Sepolia if available
            const baseChain = finalChains.find((c: any) => c.id === BASE_CHAIN_ID);
            if (baseChain) {
                setSelectedChain(BASE_CHAIN_ID);
            } else if (finalChains.length > 0) {
                setSelectedChain(finalChains[0].id);
            }
        } catch (error) {
            console.error('Error fetching chains:', error);
            // If API fails, just use custom chains
            setChains(customChains);
            if (customChains.length > 0) {
                setSelectedChain(customChains[0].id);
            }
        } finally {
            setIsLoadingChains(false);
        }
    };

    // Fetch Relay quote when amount, chain, or token changes (only for topup mode with bridge)
    useEffect(() => {
        if (isTopUpMode && needsBridge && amount && parseFloat(amount) > 0 && selectedToken) {
            fetchRelayQuote();
        }
    }, [amount, selectedChain, selectedToken, isTopUpMode]);

    const fetchRelayQuote = async () => {
        setIsLoadingQuote(true);
        try {
            const amountInBaseUnits = (parseFloat(amount) * Math.pow(10, selectedToken.decimals)).toString();

            const response = await fetch(`${RELAY_API_BASE}/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: address,
                    // originChainId: selectedChain,
                    // destinationChainId: BASE_CHAIN_ID,
                    // originCurrency: selectedToken.address,
                    // destinationCurrency: MOCK_USDC_ADDRESS,
                    // amount: amountInBaseUnits,
                    // tradeType: 'EXACT_INPUT'


                    "originChainId": 10,
                    "destinationChainId": 8453,
                    "originCurrency": "0x0000000000000000000000000000000000000000",
                    "destinationCurrency": "0x0000000000000000000000000000000000000000",
                    "amount": "10000000000000000000",
                    "tradeType": "EXACT_INPUT"
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch quote');
            }

            const quote = await response.json();
            setRelayQuote(quote);
            setEstimatedFees(quote.fees);
        } catch (error) {
            console.error('Error fetching Relay quote:', error);
            setEstimatedFees(null);
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const executeBridge = async () => {
        if (!relayQuote || !kernelClient) {
            alert('Quote not available or wallet not connected');
            return;
        }

        setStep('bridging');
        setBridgeStatus('Preparing transaction...');

        try {
            const steps = relayQuote.steps;

            for (const step of steps) {
                if (step.kind === 'transaction') {
                    const item = step.items[0];

                    setBridgeStatus('Please confirm transaction in your wallet...');
                    //@ts-ignore
                    const hash = await kernelClient.sendTransaction({
                        to: item.data.to,
                        data: item.data.data,
                        value: BigInt(item.data.value || '0'),
                        chain: { id: item.data.chainId }
                    });

                    setRequestId(step.requestId);
                    setBridgeStatus('Transaction submitted. Monitoring bridge...');

                    await monitorBridgeStatus(step.requestId);
                }
            }
        } catch (error) {
            console.error('Bridge execution failed:', error);
            setBridgeStatus('Bridge failed. Please try again.');
            setTimeout(() => {
                setStep('input');
                setBridgeStatus('');
            }, 3000);
        }
    };

    const monitorBridgeStatus = async (reqId: any) => {
        const maxAttempts = 60;
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const response = await fetch(
                    `${RELAY_API_BASE}/intents/status/v3?requestId=${reqId}`
                );
                const status = await response.json();

                setBridgeStatus(`Status: ${status.status}`);

                if (status.status === 'success') {
                    setBridgeStatus('Bridge completed successfully!');

                    if (onDeposit) {
                        await onDeposit(amount, selectedWallet);
                    }

                    setTimeout(() => {
                        onClose();
                    }, 2000);
                    return true;
                } else if (status.status === 'failed') {
                    throw new Error('Bridge failed');
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkStatus, 1000);
                } else {
                    throw new Error('Bridge timeout');
                }
            } catch (error) {
                console.error('Status check failed:', error);
                setBridgeStatus('Failed to check bridge status');
                setTimeout(() => {
                    setStep('input');
                    setBridgeStatus('');
                }, 3000);
            }
        };

        await checkStatus();
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Invalid amount');
            return;
        }

        if (isTopUpMode && parseFloat(amount) > walletBalance) {
            alert('Insufficient wallet balance');
            return;
        }

        setIsDepositing(true);

        if (isFundMode) {
            setStep('address');
            setIsDepositing(false);
        } else if (needsBridge) {
            await executeBridge();
            setIsDepositing(false);
        } else {
            setStep('processing');
            try {
                await onDeposit(amount, selectedWallet);
                onClose();
            } catch (error) {
                console.error('Deposit failed:', error);
                alert('Deposit failed. Please try again.');
            } finally {
                setIsDepositing(false);
                setStep('input');
            }
        }
    };

    const copyAddress = () => {
        const addr = selectedWallet === 'EVM' ? evmAddress : solanaAddress;
        navigator.clipboard.writeText(addr);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const loadSelectedTokenBalance = async (token: any) => {
        if (!escrowService || !token) return;

        try {
            const rawBalance = await escrowService.getTokenBalance(token.address);



            const numeric = Number(rawBalance);


            const display =
                numeric >= 1
                    ? numeric.toFixed(2)
                    : numeric.toFixed(6);

            setWalletBalance(Number(display));
        } catch (error) {
            console.error('Error loading balances:', error);
            setWalletBalance(0);
        }
    };

    const currentAddress = selectedWallet === 'EVM' ? evmAddress : solanaAddress;
    const selectedChainData: any = chains.find((c: any) => c.id === selectedChain);

    if (isLoadingChains) {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading available chains...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {isTopUpMode ? 'Top Up Card' : 'Fund Wallet'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    {isTopUpMode
                        ? 'Transfer from any chain - we\'ll bridge to Base automatically'
                        : 'Select your preferred chain and token to receive funds'
                    }
                </p>

                {step === 'input' && (
                    <>
                        {/* Chain Selection (for both modes) */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isTopUpMode ? 'Source Chain' : 'Receive on Chain'}
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {chains.map((chain: any) => (
                                    <button
                                        key={chain.id}
                                        onClick={() => setSelectedChain(chain.id)}
                                        className={`p-3 rounded-xl border-2 transition-all text-left ${selectedChain === chain.id
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {chain.iconUrl && (
                                                <img
                                                    src={chain.iconUrl}
                                                    alt={chain.displayName}
                                                    className="w-5 h-5"
                                                />
                                            )}
                                            <span className="text-sm font-semibold text-gray-900">
                                                {chain.displayName}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Token Selection (for both modes) */}
                        {availableTokens.length > 1 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableTokens.map((token: any) => (
                                        <button
                                            key={token.address}
                                            onClick={() => {
                                                setSelectedToken(token);

                                            }}
                                            className={`p-3 rounded-xl border-2 transition-all text-left ${selectedToken?.address === token.address
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {token.symbol}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {token.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wallet Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isTopUpMode ? 'Wallet Type' : 'Receive Network'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedWallet('EVM')}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedWallet === 'EVM'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Wallet className="w-5 h-5 text-indigo-600" />
                                        <span className="font-semibold text-gray-900">EVM</span>
                                    </div>
                                    <p className="text-xs text-gray-600">ZeroDev Wallet</p>
                                    {isTopUpMode && (
                                        <p className="text-sm font-semibold text-indigo-600 mt-1">
                                            ${walletBalance}
                                        </p>
                                    )}
                                </button>

                                <button
                                    onClick={() => setSelectedWallet('Solana')}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedWallet === 'Solana'
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Wallet className="w-5 h-5 text-purple-600" />
                                        <span className="font-semibold text-gray-900">Solana</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Web3Auth Wallet</p>
                                    {isTopUpMode && (
                                        <p className="text-sm font-semibold text-purple-600 mt-1">
                                            $0.00
                                        </p>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount ({selectedToken?.symbol || 'USDC'})
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    step="0.01"
                                    max={isTopUpMode ? walletBalance : undefined}
                                />
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="flex space-x-2">
                                {[25, 50, 100].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setAmount(preset.toString())}
                                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                    >
                                        ${preset}
                                    </button>
                                ))}
                                {isTopUpMode && (
                                    <button
                                        onClick={() => setAmount(walletBalance.toString())}
                                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                    >
                                        Max
                                    </button>
                                )}
                            </div>

                            {/* Bridge Info (only for topup mode) */}
                            {isTopUpMode && needsBridge && amount && parseFloat(amount) > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <div className="flex items-start space-x-2 mb-2">
                                        <RefreshCw className="w-4 h-4 mt-0.5 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-blue-900">
                                                Cross-Chain Bridge Required
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Bridging from {selectedChainData?.displayName} to Base
                                            </p>
                                        </div>
                                    </div>

                                    {isLoadingQuote ? (
                                        <div className="flex items-center space-x-2 text-blue-600">
                                            <Loader className="w-4 h-4 animate-spin" />
                                            <span className="text-xs">Getting quote...</span>
                                        </div>
                                    ) : estimatedFees ? (
                                        <div className="mt-2 pt-2 border-t border-blue-200">
                                            <div className="flex justify-between text-xs text-blue-900 mb-1">
                                                <span>Gas Fee:</span>
                                                <span>${estimatedFees.gas?.amountUsd || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-blue-900 mb-1">
                                                <span>Bridge Fee:</span>
                                                <span>${estimatedFees.relayer?.amountUsd || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-blue-900 pt-1 border-t border-blue-200">
                                                <span>You'll receive:</span>
                                                <span>~${(parseFloat(amount) - parseFloat(estimatedFees.gas?.amountUsd || '0') - parseFloat(estimatedFees.relayer?.amountUsd || '0')).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Info Box */}
                            <div className={`${isTopUpMode ? 'bg-blue-50' : 'bg-green-50'} rounded-lg p-3 text-sm`}>
                                <div className="flex items-start space-x-2">
                                    {isTopUpMode ? (
                                        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                    ) : (
                                        <Wallet className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    )}
                                    <p className={isTopUpMode ? 'text-blue-900' : 'text-green-900'}>
                                        {isTopUpMode
                                            ? 'Funds will be bridged to Base and deposited to your card.'
                                            : `Send ${selectedToken?.symbol || 'USDC'} on ${selectedChainData?.displayName || 'selected network'} to your address on the next screen.`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={isDepositing}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={isDepositing || !amount || (isLoadingQuote && needsBridge && isTopUpMode) || !selectedToken}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {needsBridge && isTopUpMode ? (
                                    <>
                                        <ArrowRight className="w-4 h-4" />
                                        <span>Bridge & Top Up</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownLeft className="w-4 h-4" />
                                        <span>{isTopUpMode ? 'Top Up' : 'Continue'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {step === 'address' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Send {amount} {selectedToken?.symbol || 'USDC'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                To your {selectedWallet} wallet address on {selectedChainData?.displayName}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-xs text-gray-500 mb-2">{selectedWallet} Address</p>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                <p className="font-mono text-sm text-gray-900 truncate flex-1">
                                    {currentAddress}
                                </p>
                                <button
                                    onClick={copyAddress}
                                    className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {copiedAddress ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-gray-200 rounded-xl p-4 mb-4">
                            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                <QrCode className="w-24 h-24 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-900">
                                <strong>Network:</strong> {selectedChainData?.displayName || 'Base Sepolia'}
                            </p>
                            <p className="text-sm text-yellow-900 mt-1">
                                <strong>Token:</strong> {selectedToken?.symbol} ({selectedToken?.name})
                            </p>
                            <p className="text-xs text-yellow-800 mt-2">
                                Make sure to send {selectedToken?.symbol} on {selectedChainData?.displayName} to avoid loss of funds
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            Done
                        </button>
                    </div>
                )}

                {(step === 'processing' || step === 'bridging') && (
                    <div className="text-center py-8">
                        <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                            {step === 'bridging' ? 'Bridging Assets...' : 'Processing Top Up...'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            {bridgeStatus || 'Please confirm the transaction in your wallet'}
                        </p>
                        {requestId && (
                            <p className="text-xs text-gray-400 font-mono">
                                Request ID: {requestId.slice(0, 10)}...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}