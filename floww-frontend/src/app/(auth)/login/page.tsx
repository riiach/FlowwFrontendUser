"use client"

import React, { useState, useEffect } from "react";

import StepIndicatorDots from "@/components/shared/ui/StepIndicatorDots"
import StepIndicatorBar from "@/components/shared/ui/StepIndicatorBar"
import StepIndicator from "@/components/shared/ui/StepIndicator";
import Logo from "@/components/brand/Logo";
import GlassCard from "@/components/shared/ui/cards/GlassCard"

export default function LoginPage() {
    const [currentStep, setCurrentStep] = useState(1);

    function handleNextStep() {
        for (let i = 0; i <= 4; i++) {
            if (i === currentStep) {
                setCurrentStep(prev => prev + 1);
                break;
            }
        }

        if (currentStep === 4) {
            setCurrentStep(1);
        }
    }

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center gap-6 bg-pink-400">
            <StepIndicatorBar currentStep={currentStep} />
            <StepIndicator currentStep={currentStep} />
            <StepIndicatorDots currentStep={currentStep} />
            <Logo />
            <GlassCard className="" >
                <div className="flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-semibold">Welcome to Floww</h1>
                    <p className="text-sm text-gray-500">
                        Please sign in to continue
                    </p>
                </div>
            </GlassCard>
            <button onClick={handleNextStep} className="w-auto h-12 bg-white hover:bg-yellow-400">
                Click
            </button>
        </div>
    )
}