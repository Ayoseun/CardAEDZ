export const ZERO_DEV_RPC_URL = import.meta.env.VITE_ZERO_DEV_RPC_URL;
export const ZERO_DEV_PASSKEY_SERVER_URL = import.meta.env.VITE_ZERO_DEV_PASSKEY_SERVER_URL;



export const RELAY_LINK_API_URL =  import.meta.env.VITE_RELAY_LINK_API_URL;


export const WEB3_AUTH_CLIENT_ID = import.meta.env.VITE_WEB3_AUTH_CLIENT_ID;
export const WEB3_AUTH_BASE_RPC_URL = import.meta.env.VITE_WEB3_AUTH_BASE_RPC_URL ;
export const WEB3_AUTH_CONNECTION_ID_GOOGLE= import.meta.env.VITE_WEB3_AUTH_CONNECTION_ID_GOOGLE_DEV
export const WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS= import.meta.env.VITE_WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS_DEV
export const WEB3_AUTH_BUNDLER_CONFIG_URL= import.meta.env.VITE_WEB3_AUTH_BUNDLER_CONFIG_URL;
export const WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID =import.meta.env.VITE_WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID;


export const BASE_POOL_ADDRESS = import.meta.env.VITE_BASE_POOL_ADDRESS;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS
export const BASE_CHAIN_ID =  import.meta.env.VITE_BASE_CHAIN_ID; // Base Sepolia
export const SUPPORTED_CHAINS_MAINNET = [
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


export const SUPPORTED_CHAINS_TESTNET = [
  {
    chainName: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo"
  },
  {
    chainName: "Polygon Amoy Testnet",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology"
  },
  {
    chainName: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org"
  },
  {
    chainName: "OP Sepolia Testnet",
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io"
  },
  {
    chainName: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc"
  },
  {
    chainName: "Avalanche Fuji Testnet",
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc"
  },
  {
    chainName: "BNB Smart Chain Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545"
  },
  {
    chainName: "Monad Testnet",
    chainId: 10143, // Note: Monad testnet chain ID (verify with official docs)
    rpcUrl: "https://testnet-rpc.monad.xyz"
  },
  {
    chainName: "Mantle Sepolia Testnet",
    chainId: 5003,
    rpcUrl: "https://rpc.sepolia.mantle.xyz"
  },
  {
    chainName: "Scroll Sepolia Testnet",
    chainId: 534351,
    rpcUrl: "https://sepolia-rpc.scroll.io"
  }
];

// Alternative/Additional Testnet Options
export const ALTERNATIVE_TESTNETS = [
  // Ethereum alternatives
  {
    chainName: "Holesky Testnet",
    chainId: 17000,
    rpcUrl: "https://ethereum-holesky-rpc.publicnode.com"
  },
  {
    chainName: "Goerli Testnet (Deprecated)",
    chainId: 5,
    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY"
  },
  
  // Polygon alternatives
  {
    chainName: "Polygon Mumbai (Deprecated)",
    chainId: 80001,
    rpcUrl: "https://rpc-mumbai.maticvigil.com"
  },
];
