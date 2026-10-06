import React from 'react'

export function WalletIcon({ className = '' }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`icon wallet-icon ${className}`}>
            <rect x="3.5" y="6.5" width="17" height="13" rx="3" />
            <path d="M4 9.5h16M7 6.5V5h10v1.5" />
            <rect className="wallet-icon__card" x="8" y="11" width="9" height="5" rx="1.5" />
            <path d="M14.5 13.5h.01" strokeWidth="2.5" />
        </svg>
    )
}

export function EmailIcon({ className = '' }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`icon email-icon ${className}`}>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path className="email-icon__top-flap" d="M4 7 12 11 20 7Z" />
            <path className="email-inner-v" d="m4 7 8 6 8-6" />
        </svg>
    )
}

export function RetryIcon({ className = '' }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M13 5.5V2.8m0 2.7h-2.7" />
            <path d="M12.5 5a5.5 5.5 0 1 0 1 4.2" />
        </svg>
    )
}
