// Icon set from the approved workbench prototype: 16px grid, 1.5 stroke, rounded caps.
export type IconName =
  | 'chevron'
  | 'plus'
  | 'x'
  | 'search'
  | 'branch'
  | 'menu'
  | 'more'
  | 'folder'
  | 'sliders'
  | 'clock'
  | 'layers'
  | 'arrows'
  | 'sparkle'
  | 'mark'
  | 'trash'

const PATHS: Record<IconName, string> = {
  chevron: '<path d="m4 6 4 4 4-4"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  x: '<path d="m4 4 8 8M12 4l-8 8"/>',
  search: '<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>',
  branch:
    '<circle cx="4.5" cy="3.5" r="1.5"/><circle cx="4.5" cy="12.5" r="1.5"/><circle cx="11.5" cy="5.5" r="1.5"/><path d="M4.5 5v6M11.5 7c0 2.5-3 2.5-7 3"/>',
  menu: '<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/>',
  more: '<circle cx="3" cy="8" r=".7"/><circle cx="8" cy="8" r=".7"/><circle cx="13" cy="8" r=".7"/>',
  folder:
    '<path d="M2 4.5c0-.6.4-1 1-1h3l1.5 1.7H13c.6 0 1 .4 1 1v6.3c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1z"/>',
  sliders:
    '<path d="M4 2.5v5M4 11v2.5M8 2.5V4M8 7.5v6M12 2.5v6.5M12 12.5v1"/><circle cx="4" cy="9.2" r="1.7"/><circle cx="8" cy="5.7" r="1.7"/><circle cx="12" cy="10.7" r="1.7"/>',
  clock: '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.6V8l2.4 1.5"/>',
  layers: '<path d="m8 2 6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3"/>',
  arrows: '<path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13"/>',
  sparkle:
    '<path d="M7 2.5 8.4 6 12 7.5 8.4 9 7 12.5 5.6 9 2 7.5 5.6 6zM12.5 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
  mark: '<path d="M8 1.8 14.2 8 8 14.2 1.8 8z"/><path d="M8 5.5 10.5 8 8 10.5 5.5 8z"/>',
  trash:
    '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>',
}

export interface IconProps {
  name: IconName
  size?: number
  /** Decorative icons are hidden from screen readers. Pass a label only when the icon is the only content. */
  label?: string
}

export function Icon({ name, size = 16, label }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
      // The path strings are constants in this file, never user input.
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
