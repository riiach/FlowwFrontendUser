"use client"

import React from 'react'

const RegisterBtn = ({ children, className = '', ...props }) => {
  return (
    <button
        className={`primary-btn ${className}`.trim()}
        {...props}
    >
        {children}
    </button>
  )
}

export default RegisterBtn