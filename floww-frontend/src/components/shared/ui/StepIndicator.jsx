"use client"

import React from 'react'

const labels = ['Sign-in method', 'Verify identity', 'Session check', 'Confirmation']

const StepIndicator = ({ currentStep = 1, steps = labels, showProgress = true }) => {
  const activeStep = Math.min(Math.max(currentStep, 1), steps.length)
    const activeLabel = steps[activeStep - 1] ?? ''

    return (
        <div
            className="step-indicator"
            aria-label={`Step ${activeStep} of ${steps.length}: ${steps[activeStep - 1]}`}
        >
            <span className="step-indicator-label">{activeLabel}</span>
            {showProgress && (
                <div className="step-progress" aria-hidden="true">
                    <div className="step-progress-fill" style={{ width: `${(activeStep / steps.length) * 100}%` }} />
                </div>
            )}
        </div>
  )
}

export default StepIndicator