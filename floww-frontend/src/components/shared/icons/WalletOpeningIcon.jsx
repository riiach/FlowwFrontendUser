import React from 'react'

const WalletOpeningIcon = ({ className = '' }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`wallet-opening-icon ${className}`.trim()}>
        <rect x="3.5" y="6.5" width="17" height="13" rx="3" />
        <path d="M4 9.5h16M7 6.5V5h10v1.5" />
        <rect className="wallet-opening-icon__card" x="8" y="11" width="9" height="5" rx="1.5" />
        <path d="M14.5 13.5h.01" strokeWidth="2.5" />
    </svg>
)

export default WalletOpeningIcon
