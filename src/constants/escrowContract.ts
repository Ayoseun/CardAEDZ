// src/constants/escrowContract.ts
import { createPublicClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { BASE_POOL_ADDRESS, BASE_RPC_URL, MOCK_USDC_ADDRESS } from './config';

// Contract ABIs
const ESCROW_ABI = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'initiateWithdrawal',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'balances',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'token', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'withdrawTimelocks',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'token', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
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

    constructor(kernelClient: any, userAddress: any) {
        this.kernelClient = kernelClient;
        this.address = userAddress;
        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(BASE_RPC_URL)
        });
    }

    /**
     * Get user's balance in the escrow contract
     */
    async getEscrowBalance(tokenAddress: Address): Promise<string> {
        try {
            const userAddress = this.address;
            
            const balance = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'balances',
                args: [userAddress, tokenAddress]
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
    async depositToEscrow(tokenAddress: Address, amount: string): Promise<any> {
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
            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'deposit',
                args: [tokenAddress, amountInWei]
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

            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'initiateWithdrawal',
                args: [tokenAddress, amountInWei]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error initiating withdrawal:", error);
            throw error;
        }
    }

    /**
     * Complete withdrawal after timelock
     */
    async completeWithdrawal(tokenAddress: Address, amount: string): Promise<any> {
        try {
            const decimals = await this.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals'
            });

            const amountInWei = parseUnits(amount, decimals);

            const hash = await this.kernelClient.writeContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'withdraw',
                args: [tokenAddress, amountInWei]
            });

            const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            console.error("Error completing withdrawal:", error);
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
    }> {
        try {
             const userAddress = this.address;

            const unlockTime = await this.publicClient.readContract({
                address: CONTRACTS.escrow,
                abi: ESCROW_ABI,
                functionName: 'withdrawTimelocks',
                args: [userAddress, tokenAddress]
            });

            const currentTime = Math.floor(Date.now() / 1000);
            const unlockTimeNumber = Number(unlockTime);

            return {
                unlockTime: unlockTimeNumber,
                isLocked: unlockTimeNumber > currentTime,
                remainingTime: Math.max(0, unlockTimeNumber - currentTime),
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