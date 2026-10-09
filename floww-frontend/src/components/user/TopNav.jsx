"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import AuthBrand from "@/components/auth/shared/AuthBrand";
import BreadCrumbs from "@/components/user/BreadCrumbs"

const TopNav = () => {
    return (
        <div className="w-full h-full flex flex-row items-center justify-between pl-4 ">
            <div className="flex flex-row gap-6">
                <Link href="/app" className="h-full w-auto inline-flex items-center">
                    <AuthBrand className="text-2xl! [&_.brand-mark]:w-8 [&_.brand-mark]:h-8" />
                </Link>
                <BreadCrumbs />
            </div>

            <Link href="/" className="size-10 rounded-full overflow-hidden relative">
                <Image
                    src="/default-profile-orange-v2.png"
                    alt="profile"
                    className="object-cover"
                    fill
                />
            </Link>
        </div>

    )
}

export default TopNav;