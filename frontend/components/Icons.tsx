import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SearchIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const MapPinIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const BriefcaseIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);

export const SparklesIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
    <path d="M19 14v4M17 16h4M5 17v3M3.5 18.5h3" />
  </svg>
);

export const ArrowRightIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

export const ArrowLeftIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M19 12H5" />
    <path d="m11 19-7-7 7-7" />
  </svg>
);

export const CalendarIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </svg>
);

export const EuroIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M18 7a7 7 0 1 0 0 10" />
    <path d="M4 10h9M4 14h9" />
  </svg>
);

export const FilterIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </svg>
);

export const ShieldIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const RefreshIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 17" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 7" />
    <path d="M21 3v4h-4M3 21v-4h4" />
  </svg>
);

export const UsersIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="3" />
    <path d="M16 20a5.5 5.5 0 0 1 5.5-5" />
  </svg>
);

export const TrashIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6 18 21H6L5 6M10 11v6M14 11v6" />
  </svg>
);

export const LogoutIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const CheckIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const XIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const TrendingUpIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);

export const ChartIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 14v4M12 9v9M17 5v13" />
  </svg>
);

export const HomeIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const HeartIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-4.5-9.5-9C.8 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.2 4 4.5 8C19 16.5 12 21 12 21Z" />
  </svg>
);

export const HeartFillIcon = (p: Props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 21s-7-4.5-9.5-9C.8 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.2 4 4.5 8C19 16.5 12 21 12 21Z" />
  </svg>
);

export const PencilIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m14 6 4 4" />
  </svg>
);

export const SettingsIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 4.1V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const DatabaseIcon = (p: Props) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
  </svg>
);

export const FlameIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 2c1 4 4 6 4 10a4 4 0 0 1-8 0c0-1 .5-2 1-3-2 1-3 3-3 5a6 6 0 1 0 12 0c0-5-4-8-6-12Z" />
  </svg>
);

export const BoltIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
  </svg>
);

export const MenuIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const AlertIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.7 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.7a2 2 0 0 0-3.4 0Z" />
  </svg>
);
