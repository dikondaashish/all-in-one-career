"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ats-scanner", label: "ATS Scanner" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/emails", label: "Emails" },
  { href: "/referrals", label: "Referrals" },
  { href: "/tracker", label: "Tracker" },
  { href: "/profile", label: "Profile" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, signOutUser, hasSkippedAuth, clearSkipFlag } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            className={`hover:underline transition-colors ${
              pathname === l.href ? "font-bold underline text-blue-300" : "text-gray-200"
            }`}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>
      
      {isClient && (
        <>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {user.displayName || user.email}
              </span>
              <button
                onClick={signOutUser}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : hasSkippedAuth() ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Guest User
              </span>
              <button
                onClick={() => {
                  clearSkipFlag();
                  window.location.href = '/';
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : null}
        </>
      )}
    </nav>
  );
}
