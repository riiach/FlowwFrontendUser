import GoogleMark from '../shared/GoogleMark'

export default function SignupMethodScreen({ onWallet, onEmail, onStripe, onGoogle }) {
  return <><h1>Create an account</h1><p className="mobile-auth-description">Choose how you’d like to sign up.</p><div className="mobile-auth-actions mobile-auth-signup-methods"><button className="mobile-auth-wallet-button" type="button" onClick={onWallet}>Create an account with Wallet</button><button className="mobile-auth-email-button" type="button" onClick={onEmail}>Create an account with Email</button><button className="mobile-auth-stripe-button" type="button" onClick={onStripe}>Create an account with Stripe</button><button className="mobile-auth-google-button" type="button" onClick={onGoogle}><GoogleMark />Sign up with Google</button></div></>
}
