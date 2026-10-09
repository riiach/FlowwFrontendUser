"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
    { label: "Floww Agent", href: "/app/chat",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M12 2c.863 0 1.701.11 2.5.315L14 4.252A8 8 0 0 0 4 12c0 1.334.325 2.617.94 3.766l.35.653l-.656 2.947l2.947-.655l.653.35A7.96 7.96 0 0 0 12 20a8 8 0 0 0 7.943-8.954l1.987-.236q.07.585.07 1.19c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.709-1.176L2 22l1.176-5.291A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2m7.53-.68a.507.507 0 0 1 .94 0l.254.61a4.37 4.37 0 0 0 2.25 2.327l.717.32a.53.53 0 0 1 0 .962l-.758.338a4.36 4.36 0 0 0-2.22 2.25l-.246.566a.506.506 0 0 1-.934 0l-.247-.565a4.36 4.36 0 0 0-2.219-2.251l-.76-.338a.53.53 0 0 1 0-.963l.718-.32a4.37 4.37 0 0 0 2.251-2.325z"></path>
            </svg>
        )},
    { label: "Home", href: "/app", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M12.581 2.686a1 1 0 0 0-1.162 0l-9.5 6.786l1.162 1.627L12 4.73l8.919 6.37l1.162-1.627zm7 10l-7-5a1 1 0 0 0-1.162 0l-7 5a1 1 0 0 0-.42.814V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6.5a1 1 0 0 0-.418-.814M6 19v-4.985l6-4.286l6 4.286V19z" />
            </svg>
        ) },
    { label: "Create Mandate", href: "/app/mandate", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M4 12a8 8 0 0 0 14.615 4.5H16v-2h6v6h-2v-2.499A9.98 9.98 0 0 1 12 22C6.477 22 2 17.523 2 12zm7.53-3.68a.507.507 0 0 1 .94 0l.254.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.218 2.25l-.247.566a.506.506 0 0 1-.934 0l-.246-.565a4.36 4.36 0 0 0-2.22-2.251l-.76-.338a.53.53 0 0 1 0-.963l.718-.32a4.37 4.37 0 0 0 2.251-2.325zM12 2c5.523 0 10 4.477 10 10h-2A8 8 0 0 0 5.385 7.5H8v2H2v-6h2v2.499A9.99 9.99 0 0 1 12 2" />
            </svg>
        ) },
    { label: "Activity", href: "/app/activity", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M11 17.25A4.25 4.25 0 1 1 6.75 13H11zM17.25 13A4.25 4.25 0 1 1 13 17.25V13zm-10.5 2A2.25 2.25 0 1 0 9 17.25V15zM15 17.25A2.25 2.25 0 1 0 17.25 15H15zM6.75 2.5A4.25 4.25 0 0 1 11 6.75V11H6.75a4.25 4.25 0 1 1 0-8.5m10 .34a.538.538 0 0 1 1 0l.27.648a4.64 4.64 0 0 0 2.391 2.47l.762.34a.563.563 0 0 1 0 1.022l-.808.359a4.64 4.64 0 0 0-2.357 2.39l-.262.6c-.192.44-.8.44-.992 0l-.262-.6a4.64 4.64 0 0 0-2.357-2.39l-.808-.359a.563.563 0 0 1 0-1.022l.762-.34a4.64 4.64 0 0 0 2.391-2.47zm-10 1.66a2.25 2.25 0 0 0 0 4.5H9V6.75A2.25 2.25 0 0 0 6.75 4.5" />
            </svg>
        ) },
    { label: "Connect", href: "/app/connect", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M5 5a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h4l-1-2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1-2zm11 2h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3l-1 2h4a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4h-4zm-8 6h8v-2H8z" />
            </svg>
        ) },
    { label: "Profile", href: "/app/profile", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M10.52 19.863a9.948 9.948 0 0 1 .826-3.395a6.977 6.977 0 0 1-4.013-1.753l1.334-1.49a4.977 4.977 0 0 0 3.854 1.246a9.987 9.987 0 0 1 7.342-3.951a8 8 0 1 0-9.343 9.343Zm8.503-7.227a8.008 8.008 0 0 0-6.387 6.387l6.387-6.387ZM22 12c0 .168-.004.334-.012.5L12.5 21.988A10.11 10.11 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10Zm-12-2a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Zm7 0a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Z" />
            </svg>
        ) },
    { label: "Settings", href: "/app/settings", icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M5 7a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0m1.5-3.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7M12 8h8V6h-8zm4 9a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0m1.5-3.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7M4 16v2h8v-2z" />
            </svg>
        ) },
];

const submenus = [
    { label: "My Wallet", href: "/app/my-wallet", parentHref: "/app" },
    { label: "Transactions", href: "/app/my-wallet/transactions", parentHref: "/app/my-wallet" },
];

const allMenus = [...menus, ...submenus];

const BreadCrumbs = () => {
    const pathname = usePathname();
    const currentPathname = pathname === "/app/home" ? "/app" : pathname;
    const crumbs = [];
    let current = allMenus.find((menu) => menu.href === currentPathname);
    const visited = new Set();

    while (current && !visited.has(current.href)) {
        visited.add(current.href);
        crumbs.unshift(current);
        current = current.parentHref
            ? allMenus.find((menu) => menu.href === current.parentHref)
            : null;
    }

    if (!crumbs.length) return null;

    return (
        <nav aria-label="Breadcrumb" className="w-auto h-auto flex items-center">
            <ol className="flex items-center gap-2 text-sm text-text-muted">
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    const iconOnly = index === 0 && crumbs.length > 1;
                    return (
                        <li key={crumb.href} className="flex items-center gap-2">
                            {index > 0 && <span aria-hidden="true">&gt;</span>}
                            {isLast ? (
                                <span aria-current="page" className="flex items-center gap-2">
                                    {crumbs.length === 1 && crumb.icon}
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link href={crumb.href} aria-label={iconOnly ? crumb.label : undefined}
                                    className="flex items-center rounded focus-visible:outline-2">
                                    {iconOnly ? crumb.icon : crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default BreadCrumbs;