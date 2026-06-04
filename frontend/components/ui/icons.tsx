// components/ui/icons.tsx
// Minimal inline icon set (stroke = currentColor) so KPI cards get a glyph
// without pulling in an icon dependency. 20px default, sized by font/`size`.
import * as React from "react";

type IconProps = { size?: number; className?: string };

function svg(path: React.ReactNode) {
  return function Icon({ size = 20, className = "" }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };
}

export const PhoneIcon = svg(
  <path d="M4.5 5.5C4.5 4.7 5.2 4 6 4h2.2c.6 0 1.1.4 1.3 1l.9 3c.1.5 0 1-.4 1.3l-1.4 1.1a12 12 0 0 0 5 5l1.1-1.4c.3-.4.8-.5 1.3-.4l3 .9c.6.2 1 .7 1 1.3V18c0 .8-.7 1.5-1.5 1.5C10.6 19.5 4.5 13.4 4.5 5.5Z" />,
);
export const CalendarIcon = svg(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </>,
);
export const TransferIcon = svg(
  <>
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
  </>,
);
export const AlertIcon = svg(
  <>
    <path d="M12 4.5 21 19.5H3L12 4.5Z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);
export const ClockIcon = svg(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2" />
  </>,
);
export const GaugeIcon = svg(
  <>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="M12 18l4-5" />
  </>,
);
export const WrenchIcon = svg(
  <path d="M14.5 5.5a3.5 3.5 0 0 0 4.5 4.5L21 12l-9 9-3-3 9-9-1.5-2a3.5 3.5 0 0 1-2-2Z" />,
);
export const BoltIcon = svg(<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />);
export const CheckCircleIcon = svg(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>,
);
export const UsersIcon = svg(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 6M17 19a5.5 5.5 0 0 0-2.5-4.6" />
  </>,
);
export const SparkIcon = svg(
  <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />,
);

// --- Navigation + action glyphs ---------------------------------------------
export const HomeIcon = svg(
  <>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9.5h12V10" />
  </>,
);
export const HeartPulseIcon = svg(
  <>
    <path d="M12 20s-7-4.6-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-.4 1-1 1.9-1.7 2.8" />
    <path d="M11 13.5h2l1-2 1.5 3 1-1.5h2.5" />
  </>,
);
export const ChartIcon = svg(
  <>
    <path d="M4 4v16h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </>,
);
export const LayersIcon = svg(
  <>
    <path d="m12 4 8 4-8 4-8-4 8-4Z" />
    <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
  </>,
);
export const HelpIcon = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4 .5c0 1.6-2 1.8-2.4 3.2M12 16.5h.01" />
  </>,
);
export const ActivityIcon = svg(
  <path d="M3 12h4l2.5 6 4-13L17 12h4" />,
);
export const ArrowLeftIcon = svg(<path d="M15 5l-7 7 7 7M8 12h12" />);
export const ArrowDownIcon = svg(<path d="M12 5v14M5 12l7 7 7-7" />);
export const PauseIcon = svg(
  <>
    <rect x="7" y="5" width="3.2" height="14" rx="1" />
    <rect x="13.8" y="5" width="3.2" height="14" rx="1" />
  </>,
);
export const PlayIcon = svg(<path d="M7 5l11 7-11 7V5Z" />);
export const LogsIcon = svg(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M7 9l2.5 2L7 13M11.5 13h5.5" />
  </>,
);
export const RefreshIcon = svg(
  <>
    <path d="M20 11a8 8 0 0 0-14-4.5L4 8M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14 4.5L20 16M20 20v-4h-4" />
  </>,
);
export const SearchIcon = svg(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </>,
);
export const TrashIcon = svg(
  <>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </>,
);
export const EditIcon = svg(
  <>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </>,
);
export const SaveIcon = svg(
  <>
    <path d="M5 4h11l3 3v13H5V4Z" />
    <path d="M8 4v5h7M8 20v-6h8v6" />
  </>,
);
export const SunIcon = svg(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </>,
);
export const MoonIcon = svg(
  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
);
export const MailIcon = svg(
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>,
);
export const MapPinIcon = svg(
  <>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </>,
);
export const ShieldIcon = svg(
  <path d="M12 3.5 19 6v5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V6l7-2.5Z" />,
);
export const StethoscopeIcon = svg(
  <>
    <path d="M6 4v5a4 4 0 0 0 8 0V4" />
    <path d="M6 4H4.5M14 4h1.5M10 17v.5a4 4 0 0 0 8 0V15" />
    <circle cx="18" cy="13" r="2" />
  </>,
);
export const IdIcon = svg(
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6 15.5a3 3 0 0 1 6 0M14 10h4M14 13h4" />
  </>,
);
