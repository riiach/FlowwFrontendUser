import WalletProviderIcon from '../shared/WalletProviderIcon'
import LoadingDots from '../shared/LoadingDots'

export default function WalletConnectionCard({ provider, connected, connecting, onContinue, onConnect }) {
  return <div className="mt-7 rounded-2xl border border-[#EEEEEE] bg-white/75 p-5 shadow-sm backdrop-blur-md"><div className="flex items-center gap-3"><WalletProviderIcon provider={provider} className="h-8 w-8 shrink-0" /><div><p className="text-sm font-semibold">Secure wallet connection</p><p className="mt-1 text-xs text-slate-500">Signing in never approves a transaction.</p></div></div><button onClick={connected ? onContinue : onConnect} disabled={connecting} aria-busy={connecting} className={`wallet-connect-button text-sm font-semibold ${connecting ? 'wallet-connect-button--connecting' : ''} ${connected ? 'wallet-connect-button--connected' : ''}`}>{connecting ? <>Connecting<LoadingDots /></> : connected ? 'Continue' : 'Connect Wallet'}</button></div>
}
