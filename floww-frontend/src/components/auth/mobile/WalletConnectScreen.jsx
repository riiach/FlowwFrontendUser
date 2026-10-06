import WalletProviderIcon from '../shared/WalletProviderIcon'
import WalletConnectIcon from '../shared/WalletConnectIcon'
import LoadingDots from '../shared/LoadingDots'

export default function WalletConnectScreen({ mode, onConnect, onContinue }) {
  return <><h1>{mode === 'wallet-connected' ? 'Wallet connected' : 'Connect your wallet'}</h1><p className="mobile-auth-description">{mode === 'wallet-connected' ? 'Your wallet is ready to continue.' : 'Connect securely with MetaMask or WalletConnect.'}</p>{mode === 'wallet' ? <div className="mobile-auth-actions mobile-auth-wallet-providers"><button className="mobile-auth-email-button" type="button" onClick={onConnect}><span className="mobile-auth-provider-icon"><WalletProviderIcon provider="MetaMask" className="h-5 w-5" /></span>MetaMask</button><button className="mobile-auth-email-button" type="button" onClick={onConnect}><span className="mobile-auth-provider-icon"><WalletConnectIcon /></span>WalletConnect</button></div> : mode === 'wallet-connecting' ? <button className="mobile-auth-submit" type="button" disabled>Connecting<LoadingDots className="mobile-auth-loading-dots" /></button> : <button className="mobile-auth-submit" type="button" onClick={onContinue}>Continue</button>}</>
}
