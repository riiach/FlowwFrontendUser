export default function MobileAuthTopBar({ logoSrc = '/floww_logo.png', onBack }) {
  return <div className="mobile-auth-topbar"><div className="mobile-auth-small-brand"><img className="brand-mark" src={logoSrc} alt="" /><span>Floww</span></div><button type="button" className="mobile-auth-back" onClick={onBack}><span aria-hidden="true">←</span> Back</button></div>
}
