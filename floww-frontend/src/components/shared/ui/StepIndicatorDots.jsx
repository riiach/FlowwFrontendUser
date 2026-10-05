"use client"

import React from 'react'

const StepIndicatorDots = ({ currentStep = 1, totalSteps = 4, className = '' }) => {
    const activeStep = Math.min(Math.max(currentStep, 1), totalSteps)

  return (
    <div
        className={`step-indicator-dots ${className}`.trim()}
        aria-label={`Step ${activeStep} of ${totalSteps}`}
    >
        {Array.from({ length: totalSteps }, (_, index) => {
            const num = index + 1
            const state = num === activeStep ? 'current' : num < activeStep ? 'complete' : 'upcoming'
            return <span
            key={num}
            className={`step-indicator-dot ${state}`}
            aria-current={number === activeStep ? 'step' : undefined}
            >{num}</span>
        })}
    </div>
  )
}

export default StepIndicatorDots