"use client"

import React from 'react'
import Image from "next/image"

const Logo = () => {
  return (
    <a
        href="/"
        className="w-auto h-auto flex flex-row justify-center items-center gap-2 relative"
    >
      <Image
        src="/floww_logo.png"
        className="object-fit"
        width={20}
        height={20}
        alt="Floww Logo"
        priority
      />
      <p className="font-semibold text-black text-xl">Floww</p>
    </a>
  )
}

export default Logo