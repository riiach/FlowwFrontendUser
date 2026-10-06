export default function VerifyIdentityHeading({ method, intent, walletProvider, walletConnected }) {
  const title = method === 'email' ? 'Verify your email' : !walletProvider ? (intent === 'signup' ? 'Choose a wallet to sign up' : 'Choose your wallet') : walletConnected ? `${walletProvider} connected` : `Connect ${walletProvider}`
  const description = method === 'email' ? 'We’ll send a code to verify it’s you.' : !walletProvider ? 'Select a wallet to continue securely.' : `Approve the connection request in your ${walletProvider} wallet.`
  return <><h2 className="text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></>
}
