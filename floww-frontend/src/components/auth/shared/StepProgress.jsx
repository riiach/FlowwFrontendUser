import IndicatorDots from './IndicatorDots'
import IndicatorProgress from './IndicatorProgress'

const STEPS = ['Sign-in method', 'Verify identity', 'Session check', 'Confirmation']

export default function StepProgress({ step = 1 }) {
  const activeStep = Math.min(Math.max(step, 1), STEPS.length)
  return <div className="flex items-center gap-3 sm:gap-4" aria-label={`Step ${activeStep} of ${STEPS.length}: ${STEPS[activeStep - 1]}`}>
    <IndicatorDots currentStep={activeStep} />
    <IndicatorProgress currentStep={activeStep} />
  </div>
}
