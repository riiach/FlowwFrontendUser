"use client"

import React from "react"
import Image from "next/image";
import Link from "next/link";

import { ChevronUp, ChevronDown } from "lucide-react";

const ProfileToggleBar = () => {
    return(
        <div className="w-auto h-auto px-1 py-1 rounded-full bg-white flex flex-row items-center gap-3">
            <Link href="/" className="size-10 rounded-full overflow-hidden relative">
                <Image
                    src="/default-profile-orange-gray100.png"
                    alt="profile"
                    className="object-cover"
                    fill
                />
            </Link>
            <div className="w-auto h-auto flex flex-col items-start">
                <p className="text-black">Ria choi</p>
                <p className="text-text-muted -mt-1 text-sm">riiachoii@gmail.com</p>
            </div>
            <div className="w-auto h-auto flex flex-col justify-between items-center ml-4 mr-1">
                <button>
                    <ChevronDown className="size-4 text-text-muted" />
                </button>
            </div>
        </div>
    )
}

export default ProfileToggleBar;