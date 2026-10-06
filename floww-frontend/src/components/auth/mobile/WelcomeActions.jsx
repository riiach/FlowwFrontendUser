export default function WelcomeActions({ onLogin, onSignup }) {
  return <div className="mobile-auth-actions"><button className="mobile-auth-wallet-button" type="button" onClick={() => onLogin('wallet')}>Log in with Wallet</button><button className="mobile-auth-email-button" type="button" onClick={() => onLogin('email')}>Log in with Email</button><button className="mobile-auth-signup-link" type="button" onClick={onSignup}>Sign Up</button></div>
}
