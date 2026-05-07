import * as React from "react";

export interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function icon(
  displayName: string,
  defaultStrokeWidth: number,
  children: React.ReactNode,
  fill: string = "none",
) {
  const Icon = React.memo(({ className, strokeWidth = defaultStrokeWidth }: IconProps) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  ));
  Icon.displayName = displayName;
  return Icon;
}

// ── Inline formatting ───────────────────────

export const BoldIcon = icon(
  "BoldIcon",
  2,
  <>
    <path d="M14 12a4 4 0 0 0 0-8H6v8" />
    <path d="M15 20a4 4 0 0 0 0-8H6v8Z" />
  </>,
);

export const ItalicIcon = icon(
  "ItalicIcon",
  2,
  <>
    <line x1="19" x2="10" y1="4" y2="4" />
    <line x1="14" x2="5" y1="20" y2="20" />
    <line x1="15" x2="9" y1="4" y2="20" />
  </>,
);

export const UnderlineIcon = icon(
  "UnderlineIcon",
  2,
  <>
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" x2="20" y1="20" y2="20" />
  </>,
);

export const StrikethroughIcon = icon(
  "StrikethroughIcon",
  2,
  <>
    <path d="M16 4H9a3 3 0 0 0-2.83 4" />
    <path d="M14 12a4 4 0 0 1 0 8H6" />
    <line x1="4" x2="20" y1="12" y2="12" />
  </>,
);

export const CodeIcon = icon(
  "CodeIcon",
  2,
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </>,
);

// ── Block / Heading ─────────────────────────

export const Heading1Icon = icon(
  "Heading1Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="m17 12 3-2v8" />
  </>,
);

export const Heading2Icon = icon(
  "Heading2Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
  </>,
);

export const Heading3Icon = icon(
  "Heading3Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
    <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
  </>,
);

export const Heading4Icon = icon(
  "Heading4Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17 10v4h4" />
    <path d="M21 10v8" />
  </>,
);

export const Heading5Icon = icon(
  "Heading5Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17 13v-3h4" />
    <path d="M17 17.5c.5.3 1.5.5 2.5.5a2.5 2.5 0 0 0 0-5H17" />
  </>,
);

export const Heading6Icon = icon(
  "Heading6Icon",
  2,
  <>
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <circle cx="19" cy="16" r="2" />
    <path d="M20 10c-2 2-3 3.5-3 6" />
  </>,
);

export const PilcrowIcon = icon(
  "PilcrowIcon",
  2,
  <>
    <path d="M13 4v16" />
    <path d="M17 4v16" />
    <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
  </>,
);

export const QuoteIcon = icon(
  "QuoteIcon",
  2,
  <>
    <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
    <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
  </>,
);

// ── Lists ───────────────────────────────────

export const ListBulletIcon = icon(
  "ListBulletIcon",
  2,
  <>
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </>,
);

export const ListOrderedIcon = icon(
  "ListOrderedIcon",
  2,
  <>
    <line x1="10" x2="21" y1="6" y2="6" />
    <line x1="10" x2="21" y1="12" y2="12" />
    <line x1="10" x2="21" y1="18" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </>,
);

export const ListCheckIcon = icon(
  "ListCheckIcon",
  2,
  <>
    <path d="M11 18H3" />
    <path d="m15 18 2 2 4-4" />
    <path d="M16 12H3" />
    <path d="M16 6H3" />
  </>,
);

// ── Link ────────────────────────────────────

export const LinkIcon = icon(
  "LinkIcon",
  2,
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>,
);

// ── History ─────────────────────────────────

export const UndoIcon = icon(
  "UndoIcon",
  2,
  <>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </>,
);

export const RedoIcon = icon(
  "RedoIcon",
  2,
  <>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
  </>,
);

// ── Drag handle ─────────────────────────────

export const GripVerticalIcon = icon(
  "GripVerticalIcon",
  2,
  <>
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </>,
);

export const PlusIcon = icon(
  "PlusIcon",
  2,
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>,
);

// ── Color ───────────────────────────────────

export const BaselineIcon = icon(
  "BaselineIcon",
  2,
  <>
    <path d="M4 20h16" />
    <path d="m6 16 6-12 6 12" />
    <path d="M8 12h8" />
  </>,
);

export const HighlighterIcon = icon(
  "HighlighterIcon",
  2,
  <>
    <path d="m9 11-6 6v3h9l3-3" />
    <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4a2 2 0 0 1 2.8 0L22 9.2a2 2 0 0 1 0 2.8z" />
  </>,
);

export const BanIcon = icon(
  "BanIcon",
  2,
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </>,
);

// ── Alignment ───────────────────────────────

export const AlignLeftIcon = icon(
  "AlignLeftIcon",
  2,
  <>
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="15" x2="3" y1="12" y2="12" />
    <line x1="17" x2="3" y1="18" y2="18" />
  </>,
);

export const AlignCenterIcon = icon(
  "AlignCenterIcon",
  2,
  <>
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="17" x2="7" y1="12" y2="12" />
    <line x1="19" x2="5" y1="18" y2="18" />
  </>,
);

export const AlignRightIcon = icon(
  "AlignRightIcon",
  2,
  <>
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="21" x2="9" y1="12" y2="12" />
    <line x1="21" x2="7" y1="18" y2="18" />
  </>,
);

export const AlignJustifyIcon = icon(
  "AlignJustifyIcon",
  2,
  <>
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="21" x2="3" y1="12" y2="12" />
    <line x1="21" x2="3" y1="18" y2="18" />
  </>,
);

export const AlignStartIcon = icon(
  "AlignStartIcon",
  2,
  <>
    <line x1="3" x2="3" y1="4" y2="20" />
    <line x1="18" x2="6" y1="8" y2="8" />
    <line x1="14" x2="6" y1="14" y2="14" />
    <line x1="20" x2="6" y1="20" y2="20" />
  </>,
);

export const AlignEndIcon = icon(
  "AlignEndIcon",
  2,
  <>
    <line x1="21" x2="21" y1="4" y2="20" />
    <line x1="18" x2="6" y1="8" y2="8" />
    <line x1="18" x2="10" y1="14" y2="14" />
    <line x1="18" x2="4" y1="20" y2="20" />
  </>,
);

export const IndentIncreaseIcon = icon(
  "IndentIncreaseIcon",
  2,
  <>
    <polyline points="3 8 7 12 3 16" />
    <line x1="21" x2="11" y1="12" y2="12" />
    <line x1="21" x2="11" y1="6" y2="6" />
    <line x1="21" x2="11" y1="18" y2="18" />
  </>,
);

export const IndentDecreaseIcon = icon(
  "IndentDecreaseIcon",
  2,
  <>
    <polyline points="7 8 3 12 7 16" />
    <line x1="21" x2="11" y1="12" y2="12" />
    <line x1="21" x2="11" y1="6" y2="6" />
    <line x1="21" x2="11" y1="18" y2="18" />
  </>,
);

// ── Insert ──────────────────────────────────

export const HorizontalRuleIcon = icon(
  "HorizontalRuleIcon",
  2,
  <>
    <line x1="3" x2="21" y1="12" y2="12" />
  </>,
);

export const PageBreakIcon = icon(
  "PageBreakIcon",
  2,
  <>
    <rect x="6" y="3" width="12" height="6" rx="1" />
    <rect x="6" y="15" width="12" height="6" rx="1" />
    <line x1="3" x2="6" y1="12" y2="12" strokeDasharray="2 2" />
    <line x1="9" x2="15" y1="12" y2="12" strokeDasharray="2 2" />
    <line x1="18" x2="21" y1="12" y2="12" strokeDasharray="2 2" />
  </>,
);

export const TableIcon = icon(
  "TableIcon",
  2,
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" x2="21" y1="9" y2="9" />
    <line x1="3" x2="21" y1="15" y2="15" />
    <line x1="9" x2="9" y1="3" y2="21" />
    <line x1="15" x2="15" y1="3" y2="21" />
  </>,
);

export const YouTubeIcon = icon(
  "YouTubeIcon",
  2,
  <>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </>,
);

export const SettingsIcon = icon(
  "SettingsIcon",
  2,
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const AudioLinesIcon = icon(
  "AudioLinesIcon",
  2,
  <>
    <path d="M2 10v3" />
    <path d="M6 6v11" />
    <path d="M10 3v18" />
    <path d="M14 8v7" />
    <path d="M18 5v13" />
    <path d="M22 10v3" />
  </>,
);

export const VideoIcon = icon(
  "VideoIcon",
  2,
  <>
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </>,
);

export const ImageIcon = icon(
  "ImageIcon",
  2,
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>,
);

export const FrameIcon = icon(
  "FrameIcon",
  2,
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="2" x2="22" y1="9" y2="9" />
    <circle cx="6" cy="6" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="6" r="0.5" fill="currentColor" stroke="none" />
  </>,
);

export const SplitViewIcon = icon(
  "SplitViewIcon",
  2,
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M12 3v18" />
    <path d="m6 12 2-2" />
    <path d="m6 12 2 2" />
    <path d="m18 12-2-2" />
    <path d="m18 12-2 2" />
  </>,
);

export const ChevronLeftIcon = icon(
  "ChevronLeftIcon",
  2,
  <>
    <path d="m15 18-6-6 6-6" />
  </>,
);

export const ChevronDownIcon = icon(
  "ChevronDownIcon",
  2,
  <>
    <path d="m6 9 6 6 6-6" />
  </>,
);

// ── Table actions ───────────────────────────

export const RowInsertTopIcon = icon(
  "RowInsertTopIcon",
  2,
  <>
    <rect x="3" y="14" width="18" height="6" rx="1" />
    <line x1="12" x2="12" y1="3" y2="9" />
    <line x1="9" x2="15" y1="6" y2="6" />
  </>,
);

export const RowInsertBottomIcon = icon(
  "RowInsertBottomIcon",
  2,
  <>
    <rect x="3" y="4" width="18" height="6" rx="1" />
    <line x1="12" x2="12" y1="15" y2="21" />
    <line x1="9" x2="15" y1="18" y2="18" />
  </>,
);

export const ColumnInsertLeftIcon = icon(
  "ColumnInsertLeftIcon",
  2,
  <>
    <rect x="14" y="3" width="6" height="18" rx="1" />
    <line x1="3" x2="9" y1="12" y2="12" />
    <line x1="6" x2="6" y1="9" y2="15" />
  </>,
);

export const ColumnInsertRightIcon = icon(
  "ColumnInsertRightIcon",
  2,
  <>
    <rect x="4" y="3" width="6" height="18" rx="1" />
    <line x1="15" x2="21" y1="12" y2="12" />
    <line x1="18" x2="18" y1="9" y2="15" />
  </>,
);

export const RowRemoveIcon = icon(
  "RowRemoveIcon",
  2,
  <>
    <rect x="3" y="9" width="18" height="6" rx="1" />
    <line x1="9" x2="15" y1="20" y2="20" />
  </>,
);

export const ColumnRemoveIcon = icon(
  "ColumnRemoveIcon",
  2,
  <>
    <rect x="9" y="3" width="6" height="18" rx="1" />
    <line x1="20" x2="20" y1="9" y2="15" />
  </>,
);

export const TrashIcon = icon(
  "TrashIcon",
  2,
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>,
);

export const MergeIcon = icon(
  "MergeIcon",
  2,
  <>
    <path d="M8 6 4 12l4 6" />
    <path d="m16 6 4 6-4 6" />
    <path d="M12 4v16" />
  </>,
);

export const SplitIcon = icon(
  "SplitIcon",
  2,
  <>
    <path d="m16 3 5 5-5 5" />
    <path d="M21 8H8" />
    <path d="m8 21-5-5 5-5" />
    <path d="M3 16h13" />
  </>,
);

// ── Page size / Devices ─────────────────────

export const MaximizeIcon = icon(
  "MaximizeIcon",
  2,
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </>,
);

export const MonitorIcon = icon(
  "MonitorIcon",
  2,
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </>,
);

export const TabletIcon = icon(
  "TabletIcon",
  2,
  <>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="12" x2="12.01" y1="18" y2="18" />
  </>,
);

export const SmartphoneIcon = icon(
  "SmartphoneIcon",
  2,
  <>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </>,
);

// ── Text transform ──────────────────────────

export const CaseSensitiveIcon = icon(
  "CaseSensitiveIcon",
  2,
  <>
    <path d="m3 15 4-8 4 8" />
    <path d="M4 13h6" />
    <circle cx="15" cy="13" r="3" />
    <path d="M19 16v-6" />
  </>,
);

export const CaseLowerIcon = icon(
  "CaseLowerIcon",
  2,
  <>
    <circle cx="7" cy="13" r="3" />
    <path d="M11 16v-6" />
    <circle cx="17" cy="13" r="3" />
    <path d="M21 16v-6" />
  </>,
);

export const CaseUpperIcon = icon(
  "CaseUpperIcon",
  2,
  <>
    <path d="m3 15 4-8 4 8" />
    <path d="M4 13h6" />
    <path d="m13 15 4-8 4 8" />
    <path d="M14 13h6" />
  </>,
);

export const CaseCapitalizeIcon = icon(
  "CaseCapitalizeIcon",
  2,
  <>
    <path d="m3 15 4-8 4 8" />
    <path d="M4 13h6" />
    <circle cx="17" cy="13" r="3" />
    <path d="M21 16v-6" />
  </>,
);

export const SubscriptIcon = icon(
  "SubscriptIcon",
  2,
  <>
    <path d="m4 5 8 10" />
    <path d="m12 5-8 10" />
    <path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.47.27-.83.72-1 1.23" />
  </>,
);

export const SuperscriptIcon = icon(
  "SuperscriptIcon",
  2,
  <>
    <path d="m4 19 8-10" />
    <path d="m12 19-8-10" />
    <path d="M20 8h-4c0-1.5.44-2 1.5-2.5S20 4.33 20 3c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.47.27-.83.72-1 1.23" />
  </>,
);
