"use client";

import { useRouter } from 'next/navigation'
import useDesktopAuthFlow from './desktop/useDesktopAuthFlow'
import StepProgress from './shared/StepProgress'
import SessionCheck from './shared/SessionCheck'
import SignInHeader from './shared/SignInHeader'
import SecureSignInNote from './shared/SecureSignInNote'
import PromoLandscape from './desktop/PromoLandscape'
import SignInMethodStep from './desktop/SignInMethodStep'
import ConfirmationStep from './desktop/ConfirmationStep'
import VerifyIdentityStep from './desktop/VerifyIdentityStep'
import MobileAuthExperience from './mobile/MobileAuthExperience'

export default function LoginFlow({ initialIntent = 'signin', onComplete, demoVerificationCode = '123456', logoSrc = '/floww_logo.png' }) {
  const { step, method, intent, walletProvider, email, code, sent, resendSeconds, walletConnected, walletConnecting, codeError, message, setEmail, setCode, setSent, setWalletProvider, setWalletConnected, setWalletConnecting, setMessage, setCodeError, chooseMethod, chooseWalletProvider, sendCode, connectWallet, updateCode, continueFlow, restart } = useDesktopAuthFlow(initialIntent)

  const router = useRouter()
  const handleComplete = () => {
    if (onComplete) {
      onComplete()
      return
    }

    router.push('/app')
    router.refresh()
  }
  const switchAuthPage = () => router.push((initialIntent === 'signup' ? '/login' : '/signup') + window.location.search)

  return (
    <main className="login-screen bg-white font-sans text-slate-950">
      <div className="mx-auto flex h-full w-full flex-col px-3 sm:px-4 md:px-[3.5vw] py-3 sm:py-4 md:py-10">

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(150px,24dvh)] md:grid-rows-1 md:grid-cols-[1.09fr_0.91fr]">
          <PromoLandscape />

          <section id="sign-in" className={`relative order-1 flex min-h-0 items-center justify-center overflow-y-auto py-0 md:order-2 md:overflow-hidden md:pl-8 lg:pl-14 ${step === 2 ? 'step-verification' : ''}`}>
            <div className="w-full max-w-md"><SignInHeader onBack={() => router.push('/')} /><div className="step-indicator-wrap mb-5 md:mb-7"><StepProgress step={step} /></div>

              <div key={step} className="step-content">
              {step === 1 && <SignInMethodStep intent={intent} onChoose={chooseMethod} onToggleIntent={switchAuthPage} />}

              {step === 2 && <VerifyIdentityStep method={method} intent={intent} walletProvider={walletProvider} walletConnected={walletConnected} walletConnecting={walletConnecting} email={email} onEmailChange={(value) => { setEmail(value); setSent(false); setCode(''); setMessage(''); setCodeError(false) }} onSendCode={sendCode} sent={sent} code={code} onCodeChange={updateCode} resendSeconds={resendSeconds} onRetry={sendCode} message={message} codeError={codeError} onChooseWallet={chooseWalletProvider} onContinue={continueFlow} onConnectWallet={connectWallet} onBack={method === 'wallet' && walletProvider ? () => { setWalletProvider(''); setWalletConnected(false); setWalletConnecting(false); setMessage('') } : restart} />}

              {step === 3 && <SessionCheck />}

              {step === 4 && <ConfirmationStep detail={method === 'email' ? email : 'Wallet connection verified'} onContinue={handleComplete} onRestart={restart} />}
              </div>
              <SecureSignInNote />
            </div>
          </section>
        </div>
      </div>
      <MobileAuthExperience initialIntent={initialIntent} onSwitchAuth={switchAuthPage} logoSrc={logoSrc} demoVerificationCode={demoVerificationCode} onComplete={handleComplete} />
    </main>
  )
}







