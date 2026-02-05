export const ZERO_DEV_RPC_URL = import.meta.env.VITE_ZERO_DEV_RPC_URL;
export const ZERO_DEV_PASSKEY_SERVER_URL = import.meta.env.VITE_ZERO_DEV_PASSKEY_SERVER_URL;



export const RELAY_LINK_API_URL =  import.meta.env.VITE_RELAY_LINK_API_URL;
export const RELAY_LINK_TESTNET_API = import.meta.env.VITE_RELAY_LINK_TESTNET_API_URL;


export const WEB3_AUTH_CLIENT_ID = import.meta.env.VITE_WEB3_AUTH_CLIENT_ID;
export const WEB3_AUTH_BASE_RPC_URL = import.meta.env.VITE_WEB3_AUTH_BASE_RPC_URL ;
export const WEB3_AUTH_CONNECTION_ID_GOOGLE= import.meta.env.VITE_WEB3_AUTH_CONNECTION_ID_GOOGLE_DEV
export const WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS= import.meta.env.VITE_WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS_DEV
export const WEB3_AUTH_BUNDLER_CONFIG_URL= import.meta.env.VITE_WEB3_AUTH_BUNDLER_CONFIG_URL;
export const WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID =import.meta.env.VITE_WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID;


export const BASE_POOL_ADDRESS = import.meta.env.VITE_BASE_POOL_ADDRESS;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS
export const BASE_CHAIN_ID =  import.meta.env.VITE_BASE_CHAIN_ID; // Base Sepolia
export const SUPPORTED_CHAINS = [
  {
    chainName: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com"
  },
  {
    chainName: "Polygon Mainnet",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com"
  },
  {
    chainName: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org"
  },
  {
    chainName: "OP Mainnet",
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io"
  },
  {
    chainName: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc"
  },
  {
    chainName: "Avalanche C-Chain",
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc"
  },
  {
    chainName: "BNB Smart Chain Mainnet",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org"
  },
  {
    chainName: "Monad Mainnet",
    chainId: 41454,
    rpcUrl: "https://rpc.monad.xyz"
  },
  {
    chainName: "Mantle",
    chainId: 5000,
    rpcUrl: "https://rpc.mantle.xyz"
  },
  {
    chainName: "Scroll",
    chainId: 534352,
    rpcUrl: "https://rpc.scroll.io"
  }
];
