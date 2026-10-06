import EmailVerificationForm from './EmailVerificationForm'
import WalletProviderButton from './WalletProviderButton'
import WalletConnectionCard from './WalletConnectionCard'
import VerifyIdentityHeading from './VerifyIdentityHeading'
import StepBackButton from './StepBackButton'

export default function VerifyIdentityStep({ method, intent, walletProvider, walletConnected, walletConnecting, email, onEmailChange, onSendCode, sent, code, onCodeChange, resendSeconds, onRetry, message, codeError, onChooseWallet, onContinue, onConnectWallet, onBack }) {
  return <>
    <VerifyIdentityHeading method={method} intent={intent} walletProvider={walletProvider} walletConnected={walletConnected} />
    {method === 'email' ? <EmailVerificationForm email={email} onEmailChange={onEmailChange} onSend={onSendCode} sent={sent} code={code} onCodeChange={onCodeChange} resendSeconds={resendSeconds} onRetry={onRetry} /> : !walletProvider ? <div className="mt-7 grid gap-3"><WalletProviderButton provider="MetaMask" description="Connect using MetaMask" onClick={() => onChooseWallet('MetaMask')} /><WalletProviderButton provider="WalletConnect" description="Scan with a mobile wallet" onClick={() => onChooseWallet('WalletConnect')} /></div> : <WalletConnectionCard provider={walletProvider} connected={walletConnected} connecting={walletConnecting} onContinue={onContinue} onConnect={onConnectWallet} />}
    {message && <p role="status" className={`mt-3 text-sm ${codeError ? 'text-[#FD5A39]' : 'text-slate-600'}`}>{message}</p>}
    <StepBackButton onClick={onBack} label={method === 'wallet' && walletProvider ? 'Choose another wallet' : 'Back'} />
  </>
}
