import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import {
  WALLET_CONNECTORS,
  WEB3AUTH_NETWORK,
  MFA_LEVELS,
  type Web3AuthOptions,
  AUTH_CONNECTION,
} from '@web3auth/modal'
import {  WEB3_AUTH_CLIENT_ID, WEB3_AUTH_BUNDLER_CONFIG_URL, WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS, WEB3_AUTH_CONNECTION_ID_GOOGLE, WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID } from '../constants/config'

const web3AuthOptions: Web3AuthOptions = {

  clientId: WEB3_AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  modalConfig: {
    connectors: {
      [WALLET_CONNECTORS.AUTH]: {
        label: 'auth',
        loginMethods: {
          google: {
            name: 'google login',
            authConnection: AUTH_CONNECTION.GOOGLE,
            authConnectionId:WEB3_AUTH_CONNECTION_ID_GOOGLE
            // logoDark: "url to your custom logo which will shown in dark mode",
          },
          facebook: {
            name: 'facebook login',
            showOnModal: false, // hides the facebook option
          },
          email_passwordless: {
            name: 'email passwordless login',
            showOnModal: true,
            authConnectionId:WEB3_AUTH_CONNECTION_ID_EMAIL_PASSWORDLESS
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
        chainId: WEB3_AUTH_BUNDLER_CONFIG_CHAIN_ID,
        bundlerConfig: {
          url: WEB3_AUTH_BUNDLER_CONFIG_URL,
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