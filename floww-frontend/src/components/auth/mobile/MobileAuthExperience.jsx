"use client";

import { useEffect, useState } from 'react'
import MobileWelcomeScreen from './MobileWelcomeScreen'
import MobileAuthTopBar from './MobileAuthTopBar'
import SignupMethodScreen from './SignupMethodScreen'
import EmailEntryScreen from './EmailEntryScreen'
import CodeVerificationScreen from './CodeVerificationScreen'
import WalletConnectScreen from './WalletConnectScreen'
import ConnectionProgressScreen from './ConnectionProgressScreen'
import MobileCompleteScreen from './MobileCompleteScreen'
import MobileAuthBackgroundCard from './MobileAuthBackgroundCard'

function MobileAuthExperience({ initialIntent = 'signin', onSwitchAuth = () => {}, logoSrc = '/floww_logo.png', demoVerificationCode = '123456', onComplete = () => {} }) {
  const [mode, setMode] = useState(initialIntent === 'signup' ? 'signup-method' : 'welcome')
  const [intent, setIntent] = useState(initialIntent)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [retrySeconds, setRetrySeconds] = useState(60)
  const [oauthProvider, setOauthProvider] = useState('')
  const to = (next) => { setNotice(''); setMode(next) }
  const home = () => { if (initialIntent === 'signup' && mode === 'signup-method') { onSwitchAuth(); return }; setNotice(''); setMode(initialIntent === 'signup' ? 'signup-method' : 'welcome'); setEmail(''); setCode('') }
  const startLogin = (method) => { setIntent('signin'); setNotice(''); setMode(method) }
  const startSignup = onSwitchAuth
  const sendCode = (event) => { event.preventDefault(); setCode(''); setRetrySeconds(60); setNotice(''); setMode('code') }
  const verifyCode = (value) => {
    const nextCode = value.replace(/\D/g, '').slice(0, 6)
    setCode(nextCode)
    if (nextCode.length === 6) {
      if (nextCode === demoVerificationCode) { setNotice(''); setMode('complete') }
      else setNotice('That code doesn’t match. Please try again.')
    } else setNotice('')
  }

  useEffect(() => {
    if (mode !== 'wallet-connecting') return undefined
    const timer = window.setTimeout(() => setMode('wallet-connected'), 1900)
    return () => window.clearTimeout(timer)
  }, [mode])
  useEffect(() => {
    if (mode !== 'oauth-connecting') return undefined
    const timer = window.setTimeout(() => setMode('complete'), 1500)
    return () => window.clearTimeout(timer)
  }, [mode])
  useEffect(() => {
    if (mode !== 'code' || retrySeconds <= 0) return undefined
    const timer = window.setTimeout(() => setRetrySeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [mode, retrySeconds])

  return <div className={`mobile-auth-experience mobile-auth-experience--${mode}`} aria-label="Floww mobile sign in">
    <MobileAuthBackgroundCard key={mode} className={`mobile-auth-screen--${mode}`}>
      {mode === 'welcome' ? <MobileWelcomeScreen onLogin={startLogin} onSignup={startSignup} /> : <div className="mobile-auth-form-content">
        <MobileAuthTopBar logoSrc={logoSrc} onBack={home} />
        {mode === 'signup-method' ? <SignupMethodScreen onWallet={() => to('wallet')} onEmail={() => to('email')} onStripe={() => { setOauthProvider('Stripe'); to('oauth-connecting') }} onGoogle={() => { setOauthProvider('Google'); to('oauth-connecting') }} />
          : mode === 'email' ? <EmailEntryScreen intent={intent} name={name} email={email} demoCode={demoVerificationCode} onNameChange={setName} onEmailChange={setEmail} onSubmit={sendCode} onStripe={() => { setOauthProvider('Stripe'); to('oauth-connecting') }} onGoogle={() => { setOauthProvider('Google'); to('oauth-connecting') }} />
          : mode === 'code' ? <CodeVerificationScreen email={email} code={code} onChange={verifyCode} demoCode={demoVerificationCode} notice={notice} retrySeconds={retrySeconds} onResend={() => { setCode(''); setRetrySeconds(60); setNotice('A new verification code has been sent.') }} />
          : ['wallet', 'wallet-connecting', 'wallet-connected'].includes(mode) ? <WalletConnectScreen mode={mode} onConnect={() => to('wallet-connecting')} onContinue={() => to('complete')} />
          : mode === 'oauth-connecting' ? <ConnectionProgressScreen provider={oauthProvider} />
          : mode === 'complete' ? <MobileCompleteScreen onContinue={onComplete} />
          : null}
        {notice && mode !== 'code' && <p className="mobile-auth-notice" role="status">{notice}</p>}
      </div>}
    </MobileAuthBackgroundCard>
  </div>
}

export default MobileAuthExperience
