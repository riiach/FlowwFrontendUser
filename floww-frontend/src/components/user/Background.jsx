"use client"

import React from "react";
import Image from "next/image";

const Background = () => {
    return (
        <div className="w-screen h-screen relative bg-zinc-200">
            <Image
                src="/user_dashboard_background_2.png"
                alt="Background"
                className="object-cover"
                fill
            />
        </div>
    )
}

export default Background;