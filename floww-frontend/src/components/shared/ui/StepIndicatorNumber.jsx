"use client"

import React from 'react'

const labels = ['Sign-in method', 'Verify identity', 'Session check', 'Confirmation']

const StepIndicatorNumber = ({ currentStep = 1, steps = labels, showProgress = true }) => {
  const safeStep = Math.min(Math.max(currentStep, 1). steps.length)

    return (
        <div
            className="step-indicator"
            aria-label={`Step ${safeStep} of ${steps.length}: ${steps[safeStep - 1]}`}
        >
            <div className="floww-step-dots" aria-hidden="true">
                {steps.map((label, index) => {
                    const number = index + 1
                    const state = number === safeStep ? 'current' : number < safeStep ? 'complete' : 'upcoming'
                    return <span key={label} className={`floww-step-dot is-${state}`}>{number}</span>
                })}
            </div>
            {showProgress && (
                <div className="step-progress" aria-hidden="true">
                    <div className="step-progress-fill" style={{ width: `${(safeStep / steps.length) * 100}%` }} />
                </div>
            )}
        </div>
  )
}

export default StepIndicatorNumber