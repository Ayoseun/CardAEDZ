import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import {
  WALLET_CONNECTORS,
  WEB3AUTH_NETWORK,
  MFA_LEVELS,
  type Web3AuthOptions,
} from '@web3auth/modal'
import { BASE_RPC_URL, ETHEREUM_RPC_URL, WEB3AUTH_CLIENT_ID } from '../constants/config'

const web3AuthOptions: Web3AuthOptions = {
  clientId: WEB3AUTH_CLIENT_ID, // Pass your Web3Auth Client ID, ideally using an environment variable
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  modalConfig: {
    connectors: {
      [WALLET_CONNECTORS.AUTH]: {
        label: 'auth',
        loginMethods: {
          google: {
            name: 'google login',
            // logoDark: "url to your custom logo which will shown in dark mode",
          },
          facebook: {
            name: 'facebook login',
            showOnModal: false, // hides the facebook option
          },
          email_passwordless: {
            name: 'email passwordless login',
            showOnModal: true,
            authConnectionId: 'future-city-aedz-2026',
          }
        },
        showOnModal: true, // set to false to hide all social login methods
      },
    },
    hideWalletDiscovery: true, // set to true to hide external wallets discovery
  },
  accountAbstractionConfig: {
    smartAccountType: 'metamask',
    chains: [
      {
        chainId: '0xaa36a7',
        bundlerConfig: {
          url: ETHEREUM_RPC_URL,
        },

      },
      {
        chainId: '0x14a34',
        bundlerConfig: {
          url: BASE_RPC_URL,
        },
      },
    ],
  },
  mfaLevel: MFA_LEVELS.MANDATORY,
}

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
}

export default web3AuthContextConfig