// The one look of every right-click and action menu. The collection menu and the tab menu both use these classes.
// Plain text items, no icons, no accent colors. The shadcn base sizing, weight, and focus ring are reset here.
export const CONTEXT_MENU_PANEL = 'grid w-[188px] gap-0 rounded-[9px] border border-border bg-popover p-2 shadow-lg'
export const CONTEXT_MENU_ITEM =
  'h-auto min-h-[36px] justify-start rounded-md px-2 text-left text-[12px] font-normal text-popover-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus-visible:ring-inset focus-visible:ring-primary'
export const CONTEXT_MENU_SEPARATOR = 'mx-2 my-0 h-px bg-border'
