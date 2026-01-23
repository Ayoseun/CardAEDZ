// src/constants/escrowContract.ts
import { createPublicClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { BASE_POOL_ADDRESS, BASE_RPC_URL, MOCK_USDC_ADDRESS } from './config';
import {


    parseEther,
} from "viem";
import { gasTokenAddresses, getERC20PaymasterApproveCall } from '@zerodev/sdk';

// Contract ABIs
const ESCROW_ABI = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'timelockDuration', type: 'uint256' },
            { name: 'releasePercentagePerSpend', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'initiateWithdrawal',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'user', type: 'address' }
        ],
        outputs: []
    },
    {
        name: 'completeWithdrawal',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'user', type: 'address' }
        ],
        outputs: []
    },
    {
        name: 'cancelWithdrawal',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' }
        ],
        outputs: []
    },
    {
        name: 'reportSpend',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'escrowId', type: 'uint256' },
            { name: 'spentAmount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'getAvailableBalance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'escrowId', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'getUserEscrowId',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'token', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'getSpendProofs',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'escrowId', type: 'uint256' }
        ],
        outputs: [
            {
                name: '',
                type: 'tuple[]',
                components: [
                    { name: 'escrowId', type: 'uint256' },
                    { name: 'spentAmount', type: 'uint256' },
                    { name: 'timestamp', type: 'uint256' },
                    { name: 'verified', type: 'bool' },
                    { name: 'verifiedBy', type: 'address' }
                ]
            }
        ]
    },
    {
        name: 'escrows',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'escrowId', type: 'uint256' }
        ],
        outputs: [
            { name: 'user', type: 'address' },
            { name: 'token', type: 'address' },
            { name: 'totalDeposited', type: 'uint256' },
            { name: 'releasedAmount', type: 'uint256' },
            { name: 'creationTime', type: 'uint256' },
            { name: 'timelockDuration', type: 'uint256' },
            { name: 'releasePercentagePerSpend', type: 'uint256' },
            { name: 'isActive', type: 'bool' },
            { name: 'pendingWithdrawal', type: 'uint256' },
            { name: 'withdrawUnlockTime', type: 'uint256' }
        ]
    }
] as const;

const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
    }
] as const;

export const CONTRACTS = {
    escrow: BASE_POOL_ADDRESS as Address,
    usdc: MOCK_USDC_ADDRESS as Address,
};

export class EscrowService {
    private kernelClient: any;
    private publicClient: any;
    private address: any;
    private paymasterClient: any;
    private entryPoint: any;

    constructor(kernelClient: any, userAddress: any, paymasterClient: any, entryPoint: any) {
        this.kernelClient = kernelClient;
        this.address = userAddress;
        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(BASE_RPC_URL)
        });
        this.paymasterClient = paymasterClient
        this.entryPoint = entryPoint
       
    }

    /**
     * Get user's balance in the escrow contract
     */
    async getEscrowBalance(tokenAddress: Address): Promise<string> {
        try {
            const userAddress = this.address;

            const escrowId = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getUserEscrowId',
                args: [userAddress, tokenAddress]
            });

            const balance = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getAvailableBalance',
                args: [escrowId]
            });

            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            return formatUnits(balance, decimals);
        } catch (error) {
            console.error("Error getting escrow balance:", error);
            return "0.00";
        }
    }

    /**
     * Get user's token balance in wallet
     */
    async getTokenBalance(tokenAddress: Address): Promise<string> {
        try {
            const userAddress = this.address;

            const balance = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [userAddress]
            });
            console.log("Token balance in wei:", balance);
            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            return formatUnits(balance, decimals);
        } catch (error) {
            console.error("Error getting token balance:", error);
            return "0.00";
        }
    }

    /**
     * Report a spend to the escrow contract
     */
    async reportSpend(tokenAddress: Address, amount: string): Promise<any> {
        try {
            const userAddress = this.address;

            // Get escrow ID
            const escrowId = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getUserEscrowId',
                args: [userAddress, tokenAddress]
            });

            if (escrowId === 0n) {
                throw new Error("No escrow found for this token");
            }

            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const amountInWei = parseUnits(amount, decimals);

            // Report spend using kernel client
            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'reportSpend',
                args: [escrowId, amountInWei]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error reporting spend:", error);
            throw error;
        }
    }

    /**
     * Get spend proofs for user's escrow
     */
    async getSpendProofs(tokenAddress: Address): Promise<{
        totalSpent: string;
        monthlySpent: string;
        proofs: Array<{
            amount: string;
            timestamp: number;
            verified: boolean;
            verifiedBy: string;
        }>;
    }> {
        try {
            const userAddress = this.address;

            // Get escrow ID
            const escrowId = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getUserEscrowId',
                args: [userAddress, tokenAddress]
            });

            if (escrowId === 0n) {
                return {
                    totalSpent: "0",
                    monthlySpent: "0",
                    proofs: []
                };
            }

            // Get spend proofs
            const proofs = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getSpendProofs',
                args: [escrowId]
            }) as any[];

            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            console.log("Fetched proofs:", proofs);

            // Calculate totals - USING BIGINT THROUGHOUT
            let totalSpent = 0n;
            let monthlySpent = 0n;
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            const monthAgo = currentTime - BigInt(30 * 24 * 60 * 60);

            const formattedProofs = proofs.map((proof: any) => {
                // Access properties by name instead of index
                const amount = proof.spentAmount; // Changed from proof[1]
                const timestamp = proof.timestamp; // Changed from proof[2]

                console.log("Proof timestamp:", timestamp);

                totalSpent += amount;
                if (timestamp >= monthAgo) {
                    monthlySpent += amount;
                }

                console.log("Monthly spent:", monthlySpent);
                console.log("Total spent:", totalSpent);

                return {
                    amount: formatUnits(amount, decimals),
                    timestamp: Number(timestamp),
                    verified: proof.verified, // Changed from proof[3]
                    verifiedBy: proof.verifiedBy // Changed from proof[4]
                };
            });

            return {
                totalSpent: formatUnits(totalSpent, decimals),
                monthlySpent: formatUnits(monthlySpent, decimals),
                proofs: formattedProofs
            };
        } catch (error) {
            console.error("Error getting spend proofs:", error);
            return {
                totalSpent: "0",
                monthlySpent: "0",
                proofs: []
            };
        }
    }
    /**
     * Approve token spending for escrow contract
     */
    async approveToken(tokenAddress: Address, amount: string): Promise<any> {
        try {
            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const amountInWei = parseUnits(amount, decimals);
            const userAddress = this.address;

            // Check current allowance
            const currentAllowance = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [userAddress, CONTRACTS.escrow]
            });

            if (currentAllowance >= amountInWei) {
                console.log("Sufficient allowance already exists");
                return { status: 'success' };
            }

            // Approve using kernel client
            const hash = await this.kernelClient.writeContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.escrow, amountInWei]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error approving token:", error);
            throw error;
        }
    }

    /**
     * Deposit tokens into escrow
     */
    async depositToEscrow(tokenAddress: Address, amount: string, timelockDuration: number, releasePercentagePerSpend: number): Promise<any> {
        try {
            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const amountInWei = parseUnits(amount, decimals);

            // First approve if needed
            await this.approveToken(tokenAddress, amount);

            // Then deposit using kernel client
            const hash = await this.kernelClient.writeContract(
                await getERC20PaymasterApproveCall(this.paymasterClient, {
                    //@ts-ignore
                    gasToken: gasTokenAddresses[chain.id]["USDC"],
                    approveAmount: parseEther("1"),
                    entryPoint: this.entryPoint,
                }), {
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'deposit',
                args: [tokenAddress, amountInWei, timelockDuration, releasePercentagePerSpend]

            });
            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error depositing to escrow:", error);
            throw error;
        }
    }

    /**
     * Initiate withdrawal (starts timelock)
     */
    async initiateWithdrawal(tokenAddress: Address, amount: string): Promise<any> {
        try {
            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const amountInWei = parseUnits(amount, decimals);
            console.log("Initiating withdrawal of amount in wei:", amountInWei);

            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'initiateWithdrawal',
                args: [tokenAddress, amountInWei, this.address]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error initiating withdrawal:", error);
            throw error;
        }
    }

    /**
     * Complete withdrawal after timelock (no amount parameter needed!)
     */
    async completeWithdrawal(tokenAddress: Address,): Promise<any> {
        try {
            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'completeWithdrawal',
                args: [tokenAddress, this.address]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error completing withdrawal:", error);
            throw error;
        }
    }

    /**
     * Cancel pending withdrawal
     */
    async cancelWithdrawal(tokenAddress: Address): Promise<any> {
        try {
            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'cancelWithdrawal',
                args: [tokenAddress]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error cancelling withdrawal:", error);
            throw error;
        }
    }

    /**
     * Check withdrawal timelock status
     */
    async getWithdrawalTimelock(tokenAddress: Address): Promise<{
        unlockTime: number;
        isLocked: boolean;
        remainingTime: number;
        pendingAmount: string;
    }> {
        try {
            const userAddress = this.address;

            // Get escrow ID
            const escrowId = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'getUserEscrowId',
                args: [userAddress, tokenAddress]
            });

            if (escrowId === 0n) {
                return {
                    unlockTime: 0,
                    isLocked: false,
                    remainingTime: 0,
                    pendingAmount: "0"
                };
            }

            // Get escrow details
            const escrowData = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'escrows',
                args: [escrowId]
            });

            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const currentTime = Math.floor(Date.now() / 1000);
            const unlockTimeNumber = Number(escrowData[9]); // withdrawUnlockTime
            const pendingWithdrawal = escrowData[8]; // pendingWithdrawal

            return {
                unlockTime: unlockTimeNumber,
                isLocked: unlockTimeNumber > currentTime && pendingWithdrawal > 0n,
                remainingTime: Math.max(0, unlockTimeNumber - currentTime),
                pendingAmount: formatUnits(pendingWithdrawal, decimals)
            };
        } catch (error) {
            console.error("Error getting withdrawal timelock:", error);
            throw error;
        }
    }
}

// Helper function to format timelock duration
export function formatTimelockDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}