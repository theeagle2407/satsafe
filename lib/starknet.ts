import { mainnet, sepolia } from '@starknet-react/chains';

export const chains = [mainnet, sepolia];

export const SUPPORTED_WALLETS = [
  {
    id: 'argentX',
    name: 'Ready Wallet',
    icon: '🟦',
  },
  {
    id: 'braavos',
    name: 'Braavos',
    icon: '🟧',
  },
  {
    id: 'okxwallet',
    name: 'OKX Wallet',
    icon: '⬛',
  },
];

export const STARKNET_TESTNET_RPC = 'https://starknet-sepolia.public.blastapi.io';

export const VAULT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: string, decimals: number = 6): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toFixed(2);
}

export const STABLE_TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
    decimals: 6,
    icon: '💵',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
    decimals: 6,
    icon: '💵',
  },
];