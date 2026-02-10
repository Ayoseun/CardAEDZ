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
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import {
    PublicKey,
} from "@solana/web3.js";
import { BASE_CHAIN_ID, RELAY_LINK_API_URL, SUPPORTED_CHAINS_TESTNET, SUPPORTED_CHAINS_MAINNET, USDC_ADDRESS, } from '../../constants/config';
import { mainnet, bsc, base, polygon, optimism, arbitrum, avalanche, monad, mantle, sepolia, baseSepolia, scroll } from 'viem/chains';
import { createPublicClient, formatEther, http } from 'viem';


export default function TopUpModal({
    onClose,
    onDeposit,
    mode = 'topup',
    address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    kernelClient,
    escrowService,
    connection,
    solanaAddress,
}: any) {

    const SUPPORTED_CHAINS = SUPPORTED_CHAINS_MAINNET;
    const ethNetwork = mainnet;
    const baseNetwork = base;
    const bscNetwork = bsc;
    const polygonNetwork = polygon;
    const optimismNetwork = optimism;
    const arbitrumNetwork = arbitrum;
    const avalancheNetwork = avalanche;
    const monadNetwork = monad;
    const mantleNetwork = mantle;
    const scrollNetwork = scroll;

    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('EVM');
    const [selectedChain, setSelectedChain]: any = useState(BASE_CHAIN_ID);
    const [selectedToken, setSelectedToken]: any = useState(null);
    const [isDepositing, setIsDepositing] = useState(false);
    const [step, setStep] = useState('input');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [relayQuote, setRelayQuote]: any = useState({});
     const [errorMessage, setErrorMessage]: any = useState({});
    const [recievingAmount, setRecievingAmount]: any = useState({});
    const [bridgeStatus, setBridgeStatus] = useState('');
    const [requestId, setRequestId] = useState('');
    const [estimatedFees, setEstimatedFees]: any = useState(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0.00);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    // Chain and token data
    const [chains, setChains]: any = useState([]);
    const [isLoadingChains, setIsLoadingChains] = useState(true);
    const [availableTokens, setAvailableTokens] = useState([]);

    const isTopUpMode = mode === 'topup';
    const isFundMode = mode === 'fund';
    const needsBridge = (selectedChain !== 8453 || (selectedToken?.symbol?.toUpperCase() !== 'USDC'));

    const evmAddress = address;


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
                ].filter(t => isTopUpMode ? t.supportsBridging : true);

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

    // Fetch balance when token or chain changes
    useEffect(() => {
        if (!selectedToken || !selectedChain) return;

        const chainData = chains.find((c: any) => c.id === selectedChain);
        if (!chainData) return;

        // Fetch balance based on token type
        fetchTokenBalance(selectedToken, chainData);

    }, [selectedToken, selectedChain, chains]);

    const fetchTokenBalance = async (token: any, chainData: any) => {
        try {
            setIsLoadingBalance(true);
            setWalletBalance(0); // Reset while loading

            // Check if it's a native token (address is 0x0000... or null)
            const isNativeToken = !token.address ||
                token.address === '0x0000000000000000000000000000000000000000' ||
                token.address === '0x0';

            if (isNativeToken) {
                // Fetch native token balance (ETH, MATIC, etc.)
                await fetchNativeTokenBalance(chainData);
            } else {
                // Fetch ERC20 token balance
                await fetchERC20TokenBalance(token, chainData);
            }
        } catch (error) {
            console.error('Error fetching token balance:', error);
            setWalletBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    const fetchNativeTokenBalance = async (chainData: any) => {
        try {
            const chainConfig = getChainConfig(selectedChain);
            if (!chainConfig) {
                console.error('Chain config not found for chainId:', selectedChain);
                setWalletBalance(0);
                return;
            }

            await getNativeBalance(chainConfig, chainData.httpRpcUrl);
        } catch (error) {
            console.error('Error fetching native balance:', error);
            setWalletBalance(0);
        }
    };

    const fetchERC20TokenBalance = async (token: any, chainData: any) => {
        try {
            const chainConfig = getChainConfig(selectedChain);
            if (!chainConfig) {
                console.error('Chain config not found for chainId:', selectedChain);
                setWalletBalance(0);
                return;
            }

            const publicClient = createPublicClient({
                chain: chainConfig,
                transport: http(chainData.httpRpcUrl),
            });

            // ERC20 balanceOf function
            const balance = await publicClient.readContract({
                address: token.address as `0x${string}`,
                abi: [
                    {
                        name: 'balanceOf',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [{ name: 'account', type: 'address' }],
                        outputs: [{ name: 'balance', type: 'uint256' }],
                    },
                ],
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            });

            // Format balance based on token decimals
            const decimals = token.decimals || 18;
            const formatted = Number(balance) / Math.pow(10, decimals);

            const display = formatted >= 1
                ? formatted.toFixed(2)
                : formatted.toFixed(6);

            setWalletBalance(Number(display));
            console.log(`${token.symbol} balance:`, display);
        } catch (error) {
            console.error('Error fetching ERC20 balance:', error);
            setWalletBalance(0);
        }
    };

    const getChainConfig = (chainId: number) => {
        switch (chainId) {
            case SUPPORTED_CHAINS[0].chainId: // Ethereum
                return ethNetwork;
            case SUPPORTED_CHAINS[1].chainId: // Polygon
                return polygonNetwork;
            case SUPPORTED_CHAINS[2].chainId: // Base
                return baseNetwork;
            case SUPPORTED_CHAINS[3].chainId: // Optimism
                return optimismNetwork;
            case SUPPORTED_CHAINS[4].chainId: // Arbitrum
                return arbitrumNetwork;
            case SUPPORTED_CHAINS[5].chainId: // Avalanche
                return avalancheNetwork;
            case SUPPORTED_CHAINS[6].chainId: // BSC
                return bscNetwork;
            case SUPPORTED_CHAINS[7].chainId: // Monad
                return monadNetwork;
            case SUPPORTED_CHAINS[8].chainId: // Mantle
                return mantleNetwork;
            case SUPPORTED_CHAINS[9].chainId: // Scroll
                return scrollNetwork;
            default:
                console.warn(`Unknown chain ID: ${chainId}, defaulting to base`);
                return baseNetwork;
        }
    };

    const fetchSolanaBalance = async (connection: any, accounts: any) => {
        if (connection && accounts && accounts.length > 0) {
            try {
                const publicKey = new PublicKey(accounts[0]);
                const balance = await connection.getBalance(publicKey);
                const solBalance = balance / 1e9; // Convert lamports to SOL
                setWalletBalance(Number(solBalance.toFixed(6)));
            } catch (err) {
                console.error('Failed to fetch Solana balance:', err);
                setWalletBalance(0);
            }
        }
    };

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
            const response = await fetch(`${RELAY_LINK_API_URL}/chains`);
            const data = await response.json();

            const supportedChainIds = new Set(SUPPORTED_CHAINS.map(chain => chain.chainId));

            const filteredChains = data.chains
                .filter((chain: any) =>
                    supportedChainIds.has(chain.id) &&
                    chain.depositEnabled &&
                    chain.vmType === 'evm' &&
                    !chain.disabled
                )
                .sort((a: any, b: any) => {
                    const aIndex = SUPPORTED_CHAINS.findIndex(p => p.chainId === a.id);
                    const bIndex = SUPPORTED_CHAINS.findIndex(p => p.chainId === b.id);
                    return aIndex - bIndex;
                });

            setChains(filteredChains);

            const baseChain = filteredChains.find((c: any) => c.id === 8453);
            if (baseChain) {
                setSelectedChain(8453);
            } else if (filteredChains.length > 0) {
                setSelectedChain(filteredChains[0].id);
            }
        } catch (error) {
            console.error('Error fetching chains:', error);
            const fallbackChains = SUPPORTED_CHAINS.map(chain => ({
                id: chain.chainId,
                name: chain.chainName.toLowerCase().replace(/\s+/g, '-'),
                displayName: chain.chainName,
                httpRpcUrl: chain.rpcUrl,
                vmType: 'evm',
                depositEnabled: true,
                disabled: false
            }));
            setChains([fallbackChains]);
            setSelectedChain(fallbackChains.find(c => c.id === 8453)?.id || fallbackChains[0]?.id);
        } finally {
            setIsLoadingChains(false);
        }
    };

    // Fetch Relay quote when amount, chain, or token changes
    useEffect(() => {
        if (isTopUpMode && needsBridge && amount && parseFloat(amount) > 0 && selectedToken) {
            fetchRelayQuote();
        }
    }, [amount, selectedChain, selectedToken, isTopUpMode]);

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
                if (!step.items || step.items.length === 0) {
                    continue;
                }

                for (const item of step.items) {
                    if (item.status === 'complete') {
                        continue;
                    }

                    if (step.kind === 'signature') {
                        await handleSignatureStep(step, item);
                    } else if (step.kind === 'transaction') {
                        await handleTransactionStep(step, item);
                    }
                }
            }

            setBridgeStatus('Bridge completed successfully!');
            if (onDeposit) {
                await onDeposit(amount, selectedWallet);
            }
            setTimeout(() => onClose(), 2000);

        } catch (error) {
            console.error('Bridge execution failed:', error);
            setBridgeStatus('Bridge failed. Please try again.');
            setTimeout(() => {
                setStep('input');
                setBridgeStatus('');
            }, 3000);
        }
    };

    const handleSignatureStep = async (step: any, item: any) => {
        setBridgeStatus(`Signing ${step.description}...`);

        const { sign, post } = item.data;
        let signature: string;

        if (sign.signatureKind === 'eip191') {
            const message = sign.message;
            signature = await kernelClient.signMessage({ message });
        } else if (sign.signatureKind === 'eip712') {
            signature = await kernelClient.signTypedData({
                domain: sign.domain,
                types: sign.types,
                primaryType: sign.primaryType,
                message: sign.value
            });
        } else {
            throw new Error(`Unsupported signature kind: ${sign.signatureKind}`);
        }

        setBridgeStatus('Submitting signature...');
        const postUrl = `${RELAY_LINK_API_URL}${post.endpoint}?signature=${signature}`;

        const response = await fetch(postUrl, {
            method: post.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(post.body)
        });

        if (!response.ok) {
            throw new Error('Failed to submit signature');
        }

        if (item.check) {
            await pollStepStatus(item.check);
        }
    };

    const handleTransactionStep = async (step: any, item: any) => {
        setBridgeStatus(`Confirming ${step.description}...`);

        const txData = item.data;

        const hash = await kernelClient.sendTransaction({
            account: kernelClient.account,
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: BigInt(txData.value || '0'),
            maxFeePerGas: BigInt(txData.maxFeePerGas || '0'),
            maxPriorityFeePerGas: BigInt(txData.maxPriorityFeePerGas || '0'),
            gas: BigInt(txData.gas || '0'),
            chain: { id: txData.chainId }
        });

        console.log('Transaction submitted:', hash);
        setBridgeStatus('Transaction submitted. Monitoring status...');

        if (step.requestId) {
            setRequestId(step.requestId);
        }

        if (item.check) {
            await pollStepStatus(item.check);
        }
    };

    const pollStepStatus = async (check: { endpoint: string; method: string }) => {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${RELAY_LINK_API_URL}${check.endpoint}`, {
                    method: check.method
                });

                if (!response.ok) {
                    throw new Error('Status check failed');
                }

                const status = await response.json();
                setBridgeStatus(`Status: ${status.status}`);

                if (status.status === 'success') {
                    return;
                } else if (status.status === 'failed') {
                    throw new Error('Step failed');
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;

            } catch (error) {
                console.error('Status check error:', error);
                throw error;
            }
        }

        throw new Error('Status check timeout');
    };

    const fetchRelayQuote = async () => {
        setIsLoadingQuote(true);
        console.log("chain", selectedToken)
        try {
            const amountInBaseUnits = (
                parseFloat(amount) * Math.pow(10, selectedToken.decimals)
            ).toString();

            const response = await fetch(`${RELAY_LINK_API_URL}/quote/v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "user": address,
                    "originChainId": selectedChain,
                    "destinationChainId": BASE_CHAIN_ID,
                    "originCurrency": selectedToken.address,
                    "destinationCurrency": USDC_ADDRESS,
                    "amount": amountInBaseUnits,
                    "tradeType": "EXACT_INPUT"
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch quote');
            }

            const quote = await response.json();
            setRelayQuote(quote);
            setEstimatedFees(quote.fees);
            console.log("quote", quote)
            const receive = parseFloat(quote.fees.relayer.amountUsd) + parseFloat(quote.fees.relayerGas.amountUsd) + parseFloat(quote.fees.relayerService.amountUsd)
            const willGet = parseFloat(quote.details.currencyOut.amountUsd) - receive
            setRecievingAmount(willGet)
        } catch (error:any) {
            console.error('Error fetching Relay quote:', error);
            setEstimatedFees(null);
            setErrorMessage(error.message);
        } finally {
            setIsLoadingQuote(false);
        }
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
                        {/* Chain Selection */}
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

                        {/* Token Selection */}
                        {availableTokens.length > 1 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableTokens.map((token: any) => (
                                        <button
                                            key={token.address || token.id}
                                            onClick={() => setSelectedToken(token)}
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

                        {/* Wallet Balance Display */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Available Balance:</span>
                                <div className="flex items-center space-x-2">
                                    {isLoadingBalance ? (
                                        <Loader className="w-4 h-4 animate-spin text-indigo-600" />
                                    ) : (
                                        <span className="text-sm font-semibold text-gray-900">
                                            {walletBalance.toFixed(6)} {selectedToken?.symbol || ''}
                                        </span>
                                    )}
                                </div>
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

                            {/* Bridge Info */}
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
                                                <span>
                                                    ~$
                                                    {recievingAmount != null
                                                        ? recievingAmount.toFixed(2)
                                                        : '0.00'}
                                                </span>
                                            </div>

                                        </div>
                                    ) : <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-red-600 flex items-start space-x-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                                        <span>{errorMessage.toString()}</span>
                                    </div>}
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