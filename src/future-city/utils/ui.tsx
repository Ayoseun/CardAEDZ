import { Transaction } from '../types';
import { RefreshCw, Send, ArrowDownLeft, Gift, Building2, List, X } from 'lucide-react';
import React from 'react';

export const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'convert': return React.createElement(RefreshCw, { className: 'w-5 h-5' });
    case 'convert_from': return React.createElement(RefreshCw, { className: 'w-5 h-5' });
    case 'send': return React.createElement(Send, { className: 'w-5 h-5' });
    case 'receive': return React.createElement(ArrowDownLeft, { className: 'w-5 h-5' });
    case 'reward': return React.createElement(Gift, { className: 'w-5 h-5' });
    case 'sell': return React.createElement(Gift, { className: 'w-5 h-5' });
    case 'investment': return React.createElement(Building2, { className: 'w-5 h-5' });
    case 'listed': return React.createElement(List, { className: 'w-5 h-5' });
    case 'cancelled': return React.createElement(X, { className: 'w-5 h-5' });
    default: return React.createElement(RefreshCw, { className: 'w-5 h-5' });
  }
};

export const getIconBgColor = (type: Transaction['type']) => {
  switch (type) {
    case 'convert': return 'bg-purple-100 text-purple-600';
    case 'convert_from': return 'bg-orange-100 text-orange-600';
    case 'send': return 'bg-red-100 text-red-600';
    case 'receive': return 'bg-green-100 text-green-600';
    case 'reward': return 'bg-purple-100 text-purple-600';
    case 'sell': return 'bg-orange-100 text-orange-600';
    case 'investment': return 'bg-blue-100 text-blue-600';
    case 'listed': return 'bg-purple-100 text-purple-600';
    case 'cancelled': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export const getModalIconGradient = (type: Transaction['type']) => {
  switch (type) {
    case 'convert': return 'from-purple-500 to-indigo-600';
    case 'convert_from': return 'from-orange-400 to-orange-600';
    case 'send': return 'from-red-400 to-red-600';
    case 'receive': return 'from-green-400 to-emerald-600';
    case 'reward': return 'from-purple-400 to-pink-500';
    case 'sell': return 'from-orange-400 to-orange-600';
    case 'investment': return 'from-blue-400 to-blue-600';
    case 'listed': return 'from-purple-400 to-purple-600';
    case 'cancelled': return 'from-gray-400 to-gray-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const getModalIconEmoji = (type: Transaction['type']) => {
  switch (type) {
    case 'convert': return '🔄';
    case 'convert_from': return '🔄';
    case 'send': return '📤';
    case 'receive': return '📥';
    case 'reward': return '🎁';
    case 'sell': return '🎁';
    case 'investment': return '🏢';
    case 'listed': return '📋';
    case 'cancelled': return '❌';
    default: return '🔄';
  }
};

export const getStatusBadge = (status: Transaction['status']) => {
  switch (status) {
    case 'completed':
      return React.createElement('span', { className: 'px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200' }, 'Completed');
    case 'pending':
      return React.createElement('span', { className: 'px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200' }, 'Pending');
    case 'failed':
      return React.createElement('span', { className: 'px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200' }, 'Failed');
    default:
      return null;
  }
};
