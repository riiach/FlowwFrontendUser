"use client"

import React from 'react'

const GlassCard = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-card card ${className} p-4 rounded-2xl`.trim()}
            {...props}
        >
            {children}
        </div>
    )
}

export default GlassCard