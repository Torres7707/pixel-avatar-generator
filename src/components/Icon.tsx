import React from 'react'

interface IconProps {
  name: string
  size?: number
}

const PATHS: Record<string, React.ReactNode> = {
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  eraser: (
    <>
      <path d="M7 21h10" />
      <path d="M5 13l6-6 8 8-6 6H9z" />
      <path d="M14 5l5 5" />
    </>
  ),
  fill: (
    <>
      <path d="M19 11l-8-8-8 8 8 8 8-8z" />
      <path d="M5 11h14" />
      <path d="M21 16c0 1.5-1.5 3-1.5 3s-1.5-1.5-1.5-3a1.5 1.5 0 0 1 3 0z" />
    </>
  ),
  picker: (
    <>
      <path d="M2 22l4-4" />
      <path d="M14.5 3.5a2.12 2.12 0 0 1 3 3L9 15l-4 1 1-4 8.5-8.5z" />
      <path d="M11 7l4 4" />
    </>
  ),
  undo: <path d="M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 13" />,
  redo: <path d="M21 7v6h-6M21 13a9 9 0 1 1-3-6.7L21 13" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 19h14" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
}

export function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon"
      aria-hidden
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
