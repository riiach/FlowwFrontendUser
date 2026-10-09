import { useEffect, useRef, useState } from 'react'

export default function useDesktopAuthFlow(initialIntent = 'signin') {
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState('')
  const [intent, setIntent] = useState(initialIntent)
  const [walletProvider, setWalletProvider] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(60)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [codeError, setCodeError] = useState(false)
  const walletTimer = useRef(null)

  useEffect(() => () => {
    if (walletTimer.current) window.clearTimeout(walletTimer.current)
  }, [])
  useEffect(() => {
    if (!sent || resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [sent, resendSeconds])
  const [message, setMessage] = useState('')

  function chooseMethod(value) {
    setMethod(value)
    setMessage('')
    setCodeError(false)
    setStep(2)
  }

  function chooseWalletProvider(value) {
    setWalletProvider(value)
    setWalletConnected(false)
    setWalletConnecting(false)
    setMessage('')
  }

  function sendCode() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Enter a valid email address.')
      setCodeError(false)
      return
    }
    setSent(true)
    setCode('')
    setResendSeconds(60)
    setMessage('Verification code sent. Check your inbox.')
    setCodeError(false)
  }

  function connectWallet() {
    if (walletConnecting || walletConnected) return
    setMessage('')
    setWalletConnecting(true)
    walletTimer.current = window.setTimeout(() => {
      walletTimer.current = null
      setWalletConnecting(false)
      setWalletConnected(true)
      setMessage('')
    }, 1800)
  }

  function startSessionCheck() {
    setMessage('')
    setCodeError(false)
    setStep(3)
    window.setTimeout(() => setStep((current) => current === 3 ? 4 : current), 900)
  }

  function updateCode(value) {
    setCode(value)
    setMessage('')
    setCodeError(false)
    if (value.length !== 6) return
    if (value === '123456') {
      startSessionCheck()
    } else {
      setMessage('That code doesn’t match. Check it and try again.')
      setCodeError(true)
    }
  }

  function continueFlow() {
    if (method === 'wallet' && !walletConnected) {
      setMessage('Connect your wallet to continue.')
      return
    }
    startSessionCheck()
  }

  function restart() {
    if (walletTimer.current) window.clearTimeout(walletTimer.current)
    walletTimer.current = null
    setWalletConnecting(false)
    setStep(1)
    setMethod('')
    setIntent(initialIntent)
    setWalletProvider('')
    setEmail('')
    setCode('')
    setSent(false)
    setResendSeconds(60)
    setWalletConnected(false)
    setMessage('')
    setCodeError(false)
  }

  return { step, method, intent, walletProvider, email, code, sent, resendSeconds, walletConnected, walletConnecting, codeError, message, setIntent, setEmail, setCode, setSent, setWalletProvider, setWalletConnected, setWalletConnecting, setMessage, setCodeError, chooseMethod, chooseWalletProvider, sendCode, connectWallet, updateCode, continueFlow, restart }
}
