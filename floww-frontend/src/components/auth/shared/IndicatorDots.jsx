const STEP_LABELS = ['Sign-in method', 'Verify identity', 'Session check', 'Confirmation']

export default function IndicatorDots({ currentStep = 1 }) {
  const activeStep = Math.min(Math.max(currentStep, 1), STEP_LABELS.length)
  return <div className="hidden items-center gap-1.5 md:flex" aria-hidden="true">{STEP_LABELS.map((label, index) => {
    const number = index + 1
    const current = number === activeStep
    const complete = number < activeStep
    const tone = current ? 'border-[#D9D9D9] bg-white text-[#666666] shadow-[0_2px_4px_rgba(0,0,0,0.035),inset_0_1px_2px_rgba(255,255,255,0.95)]' : complete ? 'border-[#F1F1F1] bg-[#FAFAFA] text-[#D0D0D0]' : 'border-[#ECECEC] bg-white text-[#BDBDBD] shadow-[0_1px_2px_rgba(0,0,0,0.018)]'
    return <span key={label} className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] font-semibold transition-all duration-700 ${tone}`}>{number}</span>
  })}</div>
}
