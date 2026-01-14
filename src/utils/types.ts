

export type Transaction = {
    id: string;
    type: 'spend' | 'deposit' | 'withdraw';
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    network: string;
    merchant?: string;
    from?: string;
    to?: string;
    txHash?: string;
};

export type User = {
    name: string;
    email: string;
    walletAddress: string;
    avatar: string;
};

export const mockTransactions: Transaction[] = [
    { id: '1', type: 'spend', amount: 45.99, merchant: 'Amazon', status: 'completed', date: '2026-01-12T10:30:00', network: 'Base' },
    { id: '2', type: 'deposit', amount: 200.00, from: 'Wallet', status: 'completed', date: '2026-01-11T15:20:00', network: 'Base' },
];
