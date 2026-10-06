export default function StepBackButton({ onClick, label = 'Back' }) {
  return <button onClick={onClick} className="step-back-button mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#555555]" aria-label={label}><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M12 4 6 10l6 6M6.5 10H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>{label}</button>
}
