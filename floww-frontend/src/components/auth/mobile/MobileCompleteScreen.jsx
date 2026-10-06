export default function MobileCompleteScreen({ onContinue }) {
  return <><div className="mobile-auth-complete-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.3 4.3L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h1>You’re all set</h1><p className="mobile-auth-description">Your session is verified. You can now continue to Floww.</p><button className="mobile-auth-submit" type="button" onClick={onContinue}>Continue to Floww</button></>
}
