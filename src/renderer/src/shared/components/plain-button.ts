// Resets the library Button base where a control keeps its own styling from index.css: height, minimum height, justification, weight, and disabled opacity.
// The library's CSS is not in a cascade layer, so a plain Tailwind utility loses to `.btn--md { height: 32px }`.
// The `!` makes each utility important, which wins over it. Without it, a control with two lines of text overflows its row.
export const plainButtonClass = 'h-auto! min-h-0! justify-start! font-normal! disabled:opacity-100!'
