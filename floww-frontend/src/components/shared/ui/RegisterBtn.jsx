"use client"

import React from 'react'

const RegisterBtn = ({children, w, h}) => {
  return (
    <button className={`primary-btn w-${w} h-${h} rounded-2xl`}>
        {children}
    </button>
  )
}

export default RegisterBtn