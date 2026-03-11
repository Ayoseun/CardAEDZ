import type { ApiTransaction, Transaction } from '../types';

export const DEBIT_TYPES = ['CONVERT_FROM_FCV', 'SEND_FCV', 'WITHDRAW_FCV', 'PROPERTY_INVESTMENT', 'FCC_LISTED'];

export const mapTransactionType = (apiType: string): Transaction['type'] => {
  const typeMap: Record<string, Transaction['type']> = {
    'CONVERT_TO_FCV': 'convert',
    'CONVERT_FROM_FCV': 'convert_from',
    'SEND_FCV': 'send',
    'RECEIVE_FCV': 'receive',
    'FCC_REWARD': 'reward',
    'FCC_SELL': 'sell',
    'PROPERTY_INVESTMENT': 'investment',
    'FCC_LISTED': 'listed',
    'FCC_LISTING_CANCELLED': 'cancelled',
    'WITHDRAW_FCV': 'send',
  };
  return typeMap[apiType] || 'convert';
};

export const mapTransactionStatus = (apiStatus: string): Transaction['status'] => {
  const statusMap: Record<string, Transaction['status']> = {
    'COMPLETED': 'completed',
    'PENDING': 'pending',
    'FAILED': 'failed',
    'PROCESSING': 'pending',
  };
  return statusMap[apiStatus] || 'pending';
};

export const getTransactionTitle = (apiType: string): string => {
  const titleMap: Record<string, string> = {
    'CONVERT_TO_FCV': 'Convert to FCV',
    'CONVERT_FROM_FCV': 'Convert from FCV',
    'SEND_FCV': 'Send FCV',
    'RECEIVE_FCV': 'Receive FCV',
    'FCC_REWARD': 'FCC Reward (Earned)',
    'FCC_SELL': 'FCC Sold',
    'PROPERTY_INVESTMENT': 'Property Investment',
    'FCC_LISTED': 'FCC Listed',
    'FCC_LISTING_CANCELLED': 'FCC Listing Cancelled',
    'WITHDRAW_FCV': 'Withdraw FCV',
  };
  return titleMap[apiType] || apiType;
};

export const formatDateTime = (isoString: string): { date: string; time: string } => {
  if (!isoString || isoString === '0001-01-01T00:00:00Z') {
    return { date: 'N/A', time: 'N/A' };
  }
  const date = new Date(isoString);
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  return {
    date: date.toLocaleDateString('en-US', dateOptions),
    time: date.toLocaleTimeString('en-US', timeOptions),
  };
};

export const mapApiTransactionToUi = (apiTx: ApiTransaction): Transaction => {
  const { date, time } = formatDateTime(apiTx.created_at);
  const type = mapTransactionType(apiTx.type);
  const isDebit = DEBIT_TYPES.includes(apiTx.type);
  const displayAmount = isDebit ? -Math.abs(apiTx.amount) : apiTx.amount;

  return {
    id: apiTx.id,
    type,
    title: getTransactionTitle(apiTx.type),
    description: apiTx.description,
    amount: displayAmount >= 0 ? `+${displayAmount}` : `${displayAmount}`,
    token: 'FCV',
    equivalentAmount: `${Math.abs(apiTx.amount)}`,
    equivalentToken: 'AEDZ',
    status: mapTransactionStatus(apiTx.status),
    date,
    time,
    txId: apiTx.id,
    txHash: apiTx.tx_hash,
    recipientWalletId: apiTx.recipient_wallet_id,
    rawAmount: apiTx.amount,
    fee: apiTx.fee,
    balanceBefore: apiTx.balance_before,
    balanceAfter: apiTx.balance_after,
    apiType: apiTx.type,
  };
};

export const formatCurrency = (value: number, currency = 'AEDZ') =>
  `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
