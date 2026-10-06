import WalletConnectIcon from './WalletConnectIcon'

export default function WalletProviderIcon({ provider, className = '' }) {
  if (provider === 'MetaMask') return <img src="/wallets/metamask.svg" alt="" className={`object-contain ${className}`} />
  return <WalletConnectIcon className={`text-[#3B99FC] ${className}`} />
}
