// src/utils/escrowContract.ts
import { ethers } from "ethers";
import type { IProvider } from "@web3auth/modal";
import { BASE_POOL_ADDRESS, BASE_USDC_ADDRESS } from "./config";

// Contract ABI - only the functions we need
const ESCROW_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function initiateWithdrawal(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function balances(address user, address token) external view returns (uint256)",
  "function withdrawTimelocks(address user, address token) external view returns (uint256)",
  "function createEscrow(address partyB, address token, uint256 amount, uint256 timelockDuration, uint256 releasePercentagePerSpend) external returns (uint256)",
  "function getEscrow(uint256 escrowId) external view returns (tuple(address partyA, address partyB, address token, uint256 totalAmount, uint256 releasedAmount, uint256 depositTime, uint256 timelockDuration, uint256 releasePercentagePerSpend, bool isActive))",
  "function reportSpend(uint256 escrowId, uint256 spentAmount) external",
  "function verifyAndRelease(uint256 escrowId, uint256 proofIndex) external",
];

// ERC20 ABI - for token approvals
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// Contract addresses (update these with your deployed addresses)
export const CONTRACTS = {
  // Base Sepolia testnet addresses
  escrow: BASE_POOL_ADDRESS, // Deploy and update
  usdc: BASE_USDC_ADDRESS, // Base Sepolia USDC
};

export class EscrowService {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.Signer;
  private escrowContract: ethers.Contract;

  constructor(web3AuthProvider: IProvider) {
    this.provider = new ethers.providers.Web3Provider(web3AuthProvider);
    this.signer = this.provider.getSigner();
    this.escrowContract = new ethers.Contract(
      CONTRACTS.escrow,
      ESCROW_ABI,
      this.signer
    );
  }

  /**
   * Get user's balance in the escrow contract
   */
  async getEscrowBalance(tokenAddress: string): Promise<string> {
    try {
      const userAddress = await this.signer.getAddress();
      const balance = await this.escrowContract.balances(userAddress, tokenAddress);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const decimals = await tokenContract.decimals();
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting escrow balance:", error);
      throw error;
    }
  }

  /**
   * Get user's token balance in wallet
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    try {
      const userAddress = await this.signer.getAddress();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  /**
   * Approve token spending for escrow contract
   */
  async approveToken(tokenAddress: string, amount: string): Promise<ethers.ContractReceipt> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      
      // Check current allowance
      const userAddress = await this.signer.getAddress();
      const currentAllowance = await tokenContract.allowance(userAddress, CONTRACTS.escrow);
      
      if (currentAllowance.gte(amountInWei)) {
        console.log("Sufficient allowance already exists");
        return { status: 1 } as ethers.ContractReceipt;
      }

      const tx = await tokenContract.approve(CONTRACTS.escrow, amountInWei);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  }

  /**
   * Deposit tokens into escrow
   */
  async depositToEscrow(
    tokenAddress: string,
    amount: string
  ): Promise<ethers.ContractReceipt> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      // First approve if needed
      await this.approveToken(tokenAddress, amount);

      // Then deposit
      const tx = await this.escrowContract.deposit(tokenAddress, amountInWei);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error depositing to escrow:", error);
      throw error;
    }
  }

  /**
   * Initiate withdrawal (starts timelock)
   */
  async initiateWithdrawal(
    tokenAddress: string,
    amount: string
  ): Promise<ethers.ContractReceipt> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      const tx = await this.escrowContract.initiateWithdrawal(tokenAddress, amountInWei);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error initiating withdrawal:", error);
      throw error;
    }
  }

  /**
   * Complete withdrawal after timelock
   */
  async completeWithdrawal(
    tokenAddress: string,
    amount: string
  ): Promise<ethers.ContractReceipt> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      const tx = await this.escrowContract.withdraw(tokenAddress, amountInWei);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error completing withdrawal:", error);
      throw error;
    }
  }

  /**
   * Check withdrawal timelock status
   */
  async getWithdrawalTimelock(tokenAddress: string): Promise<{
    unlockTime: number;
    isLocked: boolean;
    remainingTime: number;
  }> {
    try {
      const userAddress = await this.signer.getAddress();
      const unlockTime = await this.escrowContract.withdrawTimelocks(userAddress, tokenAddress);
      const currentTime = Math.floor(Date.now() / 1000);
      const unlockTimeNumber = unlockTime.toNumber();
      
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

  /**
   * Create a new escrow agreement
   */
  async createEscrow(
    partyB: string,
    tokenAddress: string,
    amount: string,
    timelockDuration: number, // in seconds
    releasePercentagePerSpend: number // in basis points (100 = 1%)
  ): Promise<{ receipt: ethers.ContractReceipt; escrowId: number }> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      // Approve first
      await this.approveToken(tokenAddress, amount);

      // Create escrow
      const tx = await this.escrowContract.createEscrow(
        partyB,
        tokenAddress,
        amountInWei,
        timelockDuration,
        releasePercentagePerSpend
      );
      const receipt = await tx.wait();

      // Extract escrowId from event
      const event = receipt.events?.find((e: any) => e.event === "EscrowCreated");
      const escrowId = event?.args?.escrowId.toNumber();

      return { receipt, escrowId };
    } catch (error) {
      console.error("Error creating escrow:", error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  async getEscrowDetails(escrowId: number) {
    try {
      const escrow = await this.escrowContract.getEscrow(escrowId);
      const tokenContract = new ethers.Contract(escrow.token, ERC20_ABI, this.provider);
      const decimals = await tokenContract.decimals();

      return {
        partyA: escrow.partyA,
        partyB: escrow.partyB,
        token: escrow.token,
        totalAmount: ethers.utils.formatUnits(escrow.totalAmount, decimals),
        releasedAmount: ethers.utils.formatUnits(escrow.releasedAmount, decimals),
        depositTime: new Date(escrow.depositTime.toNumber() * 1000),
        timelockDuration: escrow.timelockDuration.toNumber(),
        releasePercentagePerSpend: escrow.releasePercentagePerSpend.toNumber(),
        isActive: escrow.isActive,
      };
    } catch (error) {
      console.error("Error getting escrow details:", error);
      throw error;
    }
  }

  /**
   * Report spending (for partyB)
   */
  async reportSpend(escrowId: number, spentAmount: string, tokenAddress: string): Promise<ethers.ContractReceipt> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(spentAmount, decimals);

      const tx = await this.escrowContract.reportSpend(escrowId, amountInWei);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error reporting spend:", error);
      throw error;
    }
  }

  /**
   * Verify and release funds (for partyA)
   */
  async verifyAndRelease(escrowId: number, proofIndex: number): Promise<ethers.ContractReceipt> {
    try {
      const tx = await this.escrowContract.verifyAndRelease(escrowId, proofIndex);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error verifying and releasing:", error);
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