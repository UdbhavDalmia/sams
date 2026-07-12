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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAMS Logo"
    >
      {/* Floating Orange Sun */}
      <circle cx="12" cy="4.5" r="2.5" fill="#f0a020" stroke="#0f2d4a" strokeWidth="1.5" />

      {/* Left Page (Steel Blue) */}
      <path
        d="M 12 11 C 9.5 8.5, 5 8.5, 3 9.5 L 3 18.5 C 5 17.5, 9.5 17.5, 12 20 Z"
        fill="#3b6b95"
        stroke="#0f2d4a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Right Page (White) */}
      <path
        d="M 12 11 C 14.5 8.5, 19 8.5, 21 9.5 L 21 18.5 C 19 17.5, 14.5 17.5, 12 20 Z"
        fill="#ffffff"
        stroke="#0f2d4a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Book Spine Line */}
      <path d="M 12 11 L 12 20" stroke="#0f2d4a" strokeWidth="1.5" />

      {/* Ascending Bar Charts inside the Right Page */}
      <rect x="14" y="14" width="1.2" height="3.5" rx="0.3" fill="#3b6b95" />
      <rect x="16" y="12.2" width="1.2" height="5.3" rx="0.3" fill="#f0a020" />
      <rect x="18" y="10.5" width="1.2" height="7" rx="0.3" fill="#3b6b95" />
    </svg>
  );
}
