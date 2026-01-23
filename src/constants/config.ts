export const WEB3AUTH_CLIENT_ID = import.meta.env.VITE_WEB3_AUTH;

export const VAULT_CONTRACT_ID = import.meta.env.VITE_VAULT_CONTRACT_ID;
export const MOCK_USDC_ADDRESS = import.meta.env.VITE_MOCK_USDC_ADDRESS
export const ETHEREUM_RPC_URL = import.meta.env.VITE_ETHEREUM_RPC_URL;
export const POLYGON_RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL;
export const BSC_RPC_URL = import.meta.env.VITE_BSC_RPC_URL;
export const AVALANCHE_RPC_URL = import.meta.env.VITE_AVALANCHE_RPC_URL;
export const ARBITRUM_RPC_URL = import.meta.env.VITE_ARBITRUM_RPC_URL;
export const OPTIMISM_RPC_URL = import.meta.env.VITE_OPTIMISM_RPC_URL;
export const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL;
export const ZERO_DEV_RPC_URL = import.meta.env.VITE_ZERO_DEV_RPC_URL;
export const ZERO_DEV_PASSKEY_SERVER_URL = import.meta.env.VITE_ZERO_DEV_PASSKEY_SERVER_URL;
export const BASE_POOL_ADDRESS = import.meta.env.VITE_BASE_POOL_ADDRESS;
export const WEB3_AUTH_BASE_RPC_URL = import.meta.env.VITE_WEB3_AUTH_BASE_RPC_URL ;
export const RELAY_API_BASE =  import.meta.env.VITE_RELAY_LINK_API_URL;
export const RELAY_TESTNETS_API = import.meta.env.VITE_RELAY_LINK_TESTNETS_API_URL;
export const BASE_CHAIN_ID = 84532; // Base Sepolia
export const PREFERRED_CHAINS = ['base', 'ethereum', 'binance', 'polygon', 'arbitrum', 'optimism', 'solana', 'tron'];
export const CUSTOM_CHAINS = [
    {
        id: 42161, // Arbitrum One
        name: 'arbitrum',
        displayName: 'Arbitrum One',
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
        depositEnabled: true,
        vmType: 'evm',
        disabled: false,
        currency: {
            symbol: 'ETH',
            name: 'Ether',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            supportsBridging: false
        },
        erc20Currencies: [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                supportsBridging: false
            }
        ]
    },
    {
        id: 8002, // Polygon
        name: 'polygon',
        displayName: 'Polygon',
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
        depositEnabled: true,
        vmType: 'evm',
        disabled: false,
        currency: {
            symbol: 'POL',
            name: 'Polygon',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            supportsBridging: false
        },
        erc20Currencies: [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
                supportsBridging: false
            }
        ]
    },
    {
        id: 42170, // Arbitrum Nova
        name: 'arbitrum-nova',
        displayName: 'Arbitrum Nova',
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
        depositEnabled: true,
        vmType: 'evm',
        disabled: false,
        currency: {
            symbol: 'ETH',
            name: 'Ether',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            supportsBridging: false
        },
        erc20Currencies: [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                address: '0x750ba8b76187092B0D1E87E28daaf484d1b5273b',
                supportsBridging: false
            }
        ]
    },
    {
        id: 998, // Hyperliquid (Note: Actual chain ID may vary)
        name: 'hyperliquid',
        displayName: 'Hyperliquid',
        iconUrl: 'https://hyperliquid.xyz/favicon.ico',
        depositEnabled: true,
        vmType: 'evm',
        disabled: false,
        currency: {
            symbol: 'HYPE',
            name: 'Hyperliquid',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            supportsBridging: false
        },
        erc20Currencies: [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                supportsBridging: false
            }
        ]
    },
    {
        id: 1116, // Core (ARC - Core Blockchain)
        name: 'arc',
        displayName: 'ARC',
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_core.jpg',
        depositEnabled: true,
        vmType: 'evm',
        disabled: false,
        currency:  {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                address: '0xa4151B2B3e269645181dCcF2D426cE75fcbDeca9',
                supportsBridging: false
            },
        erc20Currencies: [
          
        ]
    }
];