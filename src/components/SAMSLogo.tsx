import React from "react";

interface SAMSLogoProps {
  className?: string;
  size?: number;
}

export default function SAMSLogo({ className = "", size = 20 }: SAMSLogoProps) {
  return (
    <svg
      className={`inline-block align-middle shrink-0 ${className}`}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label="SAMS Analytics Logo"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
