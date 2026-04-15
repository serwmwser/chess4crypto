import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    metaMask(),
    walletConnect({ 
      projectId: import.meta.env.VITE_WC_PROJECT_ID || 'your-project-id',
      showQrModal: true 
    }),
    coinbaseWallet({ appName: 'Chess4Crypto' })
  ],
  transports: {
    [bsc.id]: http(import.meta.env.VITE_RPC_URL || 'https://bsc-dataseed.binance.org/'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/')
  }
});

export const chessABI = [
  'function createChallenge(uint256 stake, uint8 timerIndex) external returns (uint256)',
  'function joinGame(uint256 gameId, uint256 stake) external',
  'function resolveGame(uint256 gameId, address winner, string calldata result) external',
  'function getGame(uint256 gameId) external view returns (address,address,uint256,uint256,uint256,uint8,uint256,uint256)',
  'function getPlayerProfile(address player) external view returns (uint256,uint256[])',
  'function gameToken() external view returns (address)',
  'event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stake, uint256 timer)',
  'event DrawResolved(uint256 indexed gameId, uint256 refund1, uint256 refund2)'
];

export const erc20ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];
