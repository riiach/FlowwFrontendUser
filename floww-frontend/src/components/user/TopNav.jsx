"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import AuthBrand from "@/components/auth/shared/AuthBrand";
import BreadCrumbs from "@/components/user/BreadCrumbs"
import ProfileToggleBar from "./ProfileToggleBar"

const TopNav = () => {
    return (
        <div className="w-full h-full flex flex-row items-center justify-between pl-4 ">
            <div className="flex flex-row gap-6">
                <Link href="/app" className="h-full w-auto inline-flex items-center">
                    <AuthBrand className="text-2xl! [&_.brand-mark]:w-8 [&_.brand-mark]:h-8" />
                </Link>
                <BreadCrumbs />
            </div>

            <ProfileToggleBar />
        </div>

    )
}

export default TopNav;