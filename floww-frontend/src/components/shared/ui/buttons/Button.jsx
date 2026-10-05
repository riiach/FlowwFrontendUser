"use client"

import React from 'react'

const Button = ({ children, className = '', ...props }) => {
  return (
    <button
        className={`secondary-btn ${className}`.trim()}
        {...props}
    >
        { children }
    </button>
  )
}

export default Button