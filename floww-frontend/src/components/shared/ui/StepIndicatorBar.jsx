"use client"

import React from 'react'

const StepIndicatorBar = ({ currentStep = 1, totalSteps = 4, label = '', className = '' }) => {
  const activeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const progress = (activeStep / totalSteps) * 100; // Percentage

    return (
    <div
        className={`step-progress ${className}`.trim()}
        aria-label={`${label || 'Progress'}: ${activeStep} of ${totalSteps}`} // Progress: 1 of 4
    >
        <div
            className="step-progress-copy"
        >
            <span>{label}</span>
            <span>{activeStep}/{totalSteps}</span>
        </div>
        <div
            className="step-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax={totalSteps}
            aria-valuenow={activeStep}
        >
            <span
                className="step-progress-fill"
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
  )
}

export default StepIndicatorBar