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
