const STEP_LABELS = ['Sign-in method', 'Verify identity', 'Session check', 'Confirmation']

export default function IndicatorProgress({ currentStep = 1 }) {
  const activeStep = Math.min(Math.max(currentStep, 1), STEP_LABELS.length)
  return <div className="hidden w-24 sm:block"><div className="mb-1.5 flex justify-between text-[10px] text-[#929292]"><span>{STEP_LABELS[activeStep - 1]}</span><span>{activeStep}/4</span></div><div className="h-1 overflow-hidden rounded-full bg-[#F0F0F0]" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow={activeStep}><div className="h-full rounded-full bg-[#D3D3D3] transition-all" style={{ width: `${activeStep * 25}%` }} /></div></div>
}
