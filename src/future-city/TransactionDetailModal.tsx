import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Transaction } from './types';
import { getModalIconGradient, getModalIconEmoji, getStatusBadge } from './utils/ui';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!transaction) return null;

  const isDebit = transaction.amount.startsWith('-');
  const amountColor = isDebit ? 'text-red-500' : 'text-gray-900';
  const abs = Math.abs(transaction.rawAmount);

  const copyText = (text: string, type: 'id' | 'hash') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') { setCopiedTxId(true); setTimeout(() => setCopiedTxId(false), 2000); }
    else { setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000); }
    toast.success('Copied!');
  };

  const truncate = (str: string) =>
    str && str.length > 22 ? `${str.slice(0, 10)}...${str.slice(-6)}` : str;

  const getDetailRows = (): { label: string; value: string }[] => {
    if (transaction.apiType === 'CONVERT_FROM_FCV') {
      return [
        { label: 'FCV Converted', value: `${abs} FCV` },
        { label: 'Rate', value: '1 FCV = 1 AEDZ' },
        { label: 'Total Received', value: `${abs.toFixed(2)} AEDZ` },
      ];
    }
    if (transaction.apiType === 'CONVERT_TO_FCV') {
      return [
        { label: 'AEDZ Deposited', value: `${abs} AEDZ` },
        { label: 'Rate', value: '1 AEDZ = 1 FCV' },
        { label: 'FCV Received', value: `${abs.toFixed(2)} FCV` },
      ];
    }
    if (transaction.apiType === 'FCC_SELL') {
      return [
        { label: 'FCC Sold', value: `${abs} FCC` },
        { label: 'Sale Price per FCC', value: `${transaction.equivalentAmount} AEDZ` },
        { label: 'Total Received', value: `${abs.toFixed(2)} AEDZ` },
      ];
    }
    if (transaction.apiType === 'SEND_FCV' || transaction.apiType === 'WITHDRAW_FCV') {
      return [
        { label: 'Amount Sent', value: `${abs} FCV` },
        { label: 'Network Fee', value: `${transaction.fee || 0} FCV` },
        { label: 'Total Deducted', value: `${(abs + (transaction.fee || 0)).toFixed(2)} FCV` },
      ];
    }
    if (transaction.apiType === 'RECEIVE_FCV') {
      return [
        { label: 'Amount Received', value: `${abs} FCV` },
        { label: 'Network Fee', value: '0 FCV' },
      ];
    }
    if (transaction.apiType === 'PROPERTY_INVESTMENT') {
      return [
        { label: 'Investment Amount', value: `${abs} FCV` },
        { label: 'Property Tokens', value: `${abs} FCC` },
      ];
    }
    return [{ label: 'Amount', value: `${abs} ${transaction.token}` }];
  };

  const getInfoRows = (): { label: string; value: string }[] => {
    const rows: { label: string; value: string }[] = [];
    if (transaction.recipientWalletId) {
      rows.push({ label: transaction.apiType.includes('FROM') ? 'Recipient Wallet' : 'From / To', value: truncate(transaction.recipientWalletId) });
    }
    rows.push({ label: 'Buyer', value: 'FutureCity Platform' });
    rows.push({ label: 'Payment Method', value: 'Direct Deposit to Wallet' });
    return rows;
  };

  const detailRows = getDetailRows();
  const infoRows = getInfoRows();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 15, 25, 0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="flex flex-col items-center pt-10 pb-5 px-6">
          <div className={`w-16 h-16 rounded-[18px] bg-gradient-to-br ${getModalIconGradient(transaction.type)} flex items-center justify-center shadow-lg mb-4`}>
            <span className="text-2xl">{getModalIconEmoji(transaction.type)}</span>
          </div>
          <p className={`text-4xl font-bold tracking-tight ${amountColor}`}>
            {abs} {transaction.token}
          </p>
          <p className="text-gray-400 text-sm mt-1.5">{transaction.title}</p>
        </div>

        <div className="mx-5 mb-3 rounded-2xl overflow-hidden border border-gray-100 divide-y divide-gray-100">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-4 py-3 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Transaction ID</p>
              <div className="flex items-center gap-1">
                <p className="text-xs font-mono font-semibold text-gray-700 truncate">{truncate(transaction.txId || transaction.id)}</p>
                <button onClick={() => copyText(transaction.txId || transaction.id, 'id')} className="flex-shrink-0">
                  {copiedTxId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 hover:text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Status</p>
              {getStatusBadge(transaction.status)}
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-4 py-3 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Tx Hash</p>
              {transaction.txHash ? (
                <div className="flex items-center gap-1">
                  <p className="text-xs font-mono font-semibold text-gray-700 truncate">{truncate(transaction.txHash)}</p>
                  <button onClick={() => copyText(transaction.txHash!, 'hash')} className="flex-shrink-0">
                    {copiedHash ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 hover:text-gray-500" />}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">—</p>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Timestamp</p>
              <p className="text-xs font-semibold text-gray-700">{transaction.date}</p>
              <p className="text-xs text-gray-400">{transaction.time}</p>
            </div>
          </div>
        </div>

        <div className="mx-5 mb-3 rounded-2xl overflow-hidden border border-gray-100">
          {detailRows.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < detailRows.length - 1 ? 'border-b border-gray-100' : ''} bg-white`}>
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-semibold text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mx-5 mb-7 rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-4 py-3 bg-white border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Transaction Details</p>
          </div>
          {infoRows.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3.5 bg-white ${i < infoRows.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-semibold text-gray-900 text-right max-w-[55%] break-all">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
