---
name: API Documentation Workbench
description: Dense desktop workbench for building, sending, and documenting HTTP API requests. Neutral dark surfaces, Blurple for focus and selection, electric green only for Send.
colors:
  chrome: '#0f1014'
  canvas: '#15161b'
  sidebar: '#1b1c22'
  raised: '#24252c'
  hover: '#2e2f37'
  pressed: '#3a3b44'
  line: '#2a2b33'
  line-strong: '#45474f'
  fg: '#f4f5f8'
  fg-secondary: '#cbcdd8'
  fg-muted: '#9a9dac'
  primary: '#5865f2'
  primary-text: '#c9ccff'
  primary-soft: '#5865f242'
  variable: '#5865f266'
  send: '#35ed7e'
  on-send: '#000000'
  link: '#4cc9ff'
  accent: '#ec48bd'
  ok: '#7ee2a8'
  ok-soft: '#7ee2a824'
  warn: '#ffb689'
  error: '#ff9d94'
  error-soft: '#ff9d9426'
  method-get: '#8ea6ff'
  method-post: '#7ee2a8'
  method-put: '#ffd479'
  method-patch: '#f79bdc'
  method-delete: '#ffa987'
typography:
  headline-lg:
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  headline-md:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-caps:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.08em
  body-md:
    fontFamily: Poppins
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Poppins
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  code-md:
    fontFamily: Fira Code
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: Fira Code
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  method:
    fontFamily: Fira Code
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  pill: 50px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
---

## Overview

This is a dense working tool, not a marketing page. People keep it open for hours, compare request and response side by side, and switch between dozens of requests. The interface stays quiet so the content, the JSON, and the status codes carry the attention.

The palette is a flat neutral dark. Depth comes from stepping between four surface levels, not from gradients or shadows. Blurple marks what is selected or focused. Electric green is used for one thing only: the Send button.

This file replaces the earlier Discord-inspired version. Those values (indigo canvas, gradient mesh, all-caps display type, large radii) do not apply to the app.

## Colors

### Surfaces
Four levels, darkest to lightest. Each panel uses one level, and controls sit one level above their panel.

- **chrome** (`#0f1014`): icon rail, top bar, tab strip, code background, and the split divider.
- **canvas** (`#15161b`): main work area, the request and response panes.
- **sidebar** (`#1b1c22`): collection and environment panel.
- **raised** (`#24252c`): input fields, pickers, folder counts, and popup menus.
- **hover** (`#2e2f37`): hover state on rows and buttons.
- **pressed** (`#3a3b44`): selected segment in a segmented control.

### Text
- **fg** (`#f4f5f8`): headings, request names, and primary values.
- **fg-secondary** (`#cbcdd8`): labels, tab names, and body copy.
- **fg-muted** (`#9a9dac`): hints, timestamps, placeholders, and folder counts.

### Lines
- **line** (`#2a2b33`): dividers between panels and rows.
- **line-strong** (`#45474f`): borders on inputs and the URL field.

### Brand and actions
- **primary** (`#5865f2`, Blurple): focus rings, the active rail icon, the selected row border, the active tab underline, and the primary buttons.
- **primary-text** (`#c9ccff`): text or icons that need Blurple on a dark surface, such as variables in the URL.
- **primary-soft** (`#5865f242`): the background of a selected row.
- **variable** (`#5865f266`): the highlight behind `{{variableName}}` in URLs and bodies.
- **send** (`#35ed7e`) with **on-send** (`#000000`): the Send button only. Do not use it for any other action.
- **link** (`#4cc9ff`): inline links and text actions such as Format, Copy, and Save as example.
- **accent** (`#ec48bd`, magenta): a small marker only. It colors the icon of a folder that contains the active request and marks tabs that have body content. It is never used for large areas.

### Status
- **ok** (`#7ee2a8`) with **ok-soft**: successful responses, valid JSON, active environment.
- **warn** (`#ffb689`): unsaved changes, and the dot on a request that has unsaved edits.
- **error** (`#ff9d94`) with **error-soft**: failed responses, invalid JSON, failed tests, and destructive actions.

### HTTP methods
Each method has its own color, used only for the method label in lists, tabs, and the method picker.
- GET `#8ea6ff` · POST `#7ee2a8` · PUT `#ffd479` · PATCH `#f79bdc` · DELETE `#ffa987`

## Typography

Two families, and nothing else.

- **Poppins** for all interface text, from 400 to 800 weight.
- **Fira Code** for everything that is data: URLs, JSON, header names and values, variable names, method labels, status codes, and file sizes. Monospace keeps indentation and character widths readable.

Use the scale in the front matter. Panel titles use `label-caps` (uppercase, letter-spaced) and nothing larger than 18px appears in the app chrome. Numbers in columns use tabular figures.

### Principles
- Headings are small and clear. They label panels; they do not compete with the content.
- Put a request or response in monospace, even when it is short. Readers scan it by character.
- Do not use all-caps for anything except panel titles.

## Layout

### Structure
The window has four fixed regions, from left to right:
1. **Icon rail** (64px): logo, Collections, Environments, History, API Reference, Sync, and AI Connect.
2. **Side panel** (280px): the panel named by the rail, with its own header and filter.
3. **Main work area**: the top bar, the tab strip, then the active tab. A request tab shows a request bar and a split pane. An environment tab shows a form.
4. **Response** is the right half of the split pane. The split is adjustable between 25% and 75%, and resets to 50% on double-click.

Designed for 1920×1080. The app does not scroll the whole window. Only the lists, the code editors, and the response scroll.

### Spacing
- Base unit is 4px, and most spacing uses 8, 12, or 16px.
- Panel padding is 16px. Rows are 32px tall, and 40px tall in lists that show two lines.
- Controls are 32px tall, and the URL field and Send button are 38px.

### Narrow windows
- Below 1100px, the request and response stack vertically.
- Below 760px, the side panel becomes a drawer that opens from the rail, and the rail is hidden until the menu button is pressed.

## Shapes
- **6px** (`xs`): input fields, chips, small text buttons.
- **8px** (`sm`): popup menu items.
- **12px** (`md`): pickers, rows, tree items, the URL field, and the panels inside a split.
- **16px** (`lg`): dialogs and the workspace logo.
- **50px** (`pill`): counts, badges, and status chips.

Circular shapes are used only for avatars and status dots.

## Elevation
No drop shadows inside the app. Use the surface levels to separate regions. Popup menus and dialogs are the only elements that float, and they use a single soft shadow to sit above the content.

## Components

### Buttons
- **Primary**: Blurple background, white text, 34px tall, 14px horizontal padding. Used for dialog confirmation and Set active.
- **Send**: green background, black text, 38px tall, with the shortcut shown. The only green control.
- **Secondary**: transparent with a `line-strong` border, `fg-secondary` text, 30px tall, 10px horizontal padding. Used for Add parameter, Add variable, Duplicate, and secondary dialog actions.
- **Destructive**: transparent with a `line-strong` border and `error` text. Used for Delete.
- **Text button**: `link` color, no border. Used for Format, Copy, and Save as example.
- **Icon button**: 30px square, `fg-muted` icon, `hover` background on hover.

### Tabs
- **Tab strip** (request and environment tabs): 40px tall, `chrome` background. The active tab uses `canvas` as its background and has a 2px Blurple underline. Each tab shows the method label, the name, and a close button. A tab with unsaved changes shows a warn dot.
- **Section tabs** (Params, Body, Auth, and so on): 42px tall. Counts use a `raised` pill. A dot marks a section that has content.

### Fields
- **Input**: `chrome` background, `line` border, `xs` radius, 32px tall, `code-md` for values and `body-md` for labels.
- **Focus**: Blurple border.
- **URL field**: `chrome` background, `line-strong` border, `md` radius, 38px tall. Variables are highlighted with `variable`.
- **Method picker**: `raised` background, `md` radius, method name in its method color.

### Lists and trees
- **Folder row**: 30px, `fg-secondary` text, a chevron, a folder icon, and a count pill.
- **Request row**: 32px, method label on the left, name, and a status dot on the right.
- **Selected row**: `primary-soft` background, Blurple border, `md` radius, and `fg` text in semibold.
- **Environment row**: 32px, with an `Active` label in `ok` on the active environment.

### Code and JSON
- The editor has a line-number gutter in `fg-muted` and syntax colors. Keys use `primary-text`, strings use `ok`, numbers use `warn`, and booleans and null use `method-patch`.
- A status line under the editor reports validity, such as `Valid JSON, 345 B`, in `ok` or `error`.

### Tables (headers, cookies, parameters)
- Columns: enable checkbox, name, value, and delete. Headers are `fg-muted` in `label-sm`.
- Rows have a `line` divider and no zebra striping.

### Test results
- Each test is one row with a PASS or FAIL label. A failed test shows its reason in `error` below the name.

### Dialogs and menus
- **Dialog**: `raised` background, `lg` radius, 20px padding, a title in `headline-lg`, and actions right-aligned.
- **Menu**: `pressed` background, `sm` radius, items 32px tall. The focused item uses a Blurple background with white text.

### Status states
- **Empty**: a centered title in `headline-md` and one line of `fg-muted` text that explains the next step.
- **Loading**: a 22px spinner in `primary-text` with a Cancel button.
- **Blocked** (for example, a missing variable): `error` heading and a message that names the variable and tells the user how to fix it.

## Do's and Don'ts

### Do
- Keep the four surface levels in order. Each control sits one level above its panel.
- Show status with a color and a word together, such as `201 Created` in `ok`.
- Use `variable` highlighting wherever a `{{name}}` appears.
- Keep each method in its own color everywhere it appears.
- Use Poppins for text and Fira Code for data, without exception.

### Don't
- Don't use gradients, background meshes, or animated backgrounds.
- Don't use electric green for anything except Send.
- Don't add a fourth accent. Blurple, magenta, and the status colors are the full set.
- Don't use all-caps for anything except panel titles.
- Don't put drop shadows on panels or cards.
- Don't put a secret value in the UI as plain text. Secret fields show a placeholder and never display their stored value.
