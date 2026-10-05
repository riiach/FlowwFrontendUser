"use client"

import React from 'react'

const GlassCard = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-card ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    )
}

export default GlassCard