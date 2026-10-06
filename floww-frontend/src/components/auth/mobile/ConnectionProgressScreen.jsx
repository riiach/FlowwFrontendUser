import LoadingDots from '../shared/LoadingDots'

export default function ConnectionProgressScreen({ provider }) {
  return <><h1>Connecting to {provider}</h1><p className="mobile-auth-description">Please wait while we prepare your secure sign-in.</p><button className="mobile-auth-submit" type="button" disabled>Connecting<LoadingDots className="mobile-auth-loading-dots" /></button></>
}
