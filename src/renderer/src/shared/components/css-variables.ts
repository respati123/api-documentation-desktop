import type { CSSProperties } from 'react'

// React's CSSProperties has no entries for custom properties. These types add `--name` keys, so a style object
// that sets one can be checked with `satisfies` instead of a cast.
export type CssVariables = { [name: `--${string}`]: string | number }
export type StyleWithVariables = CSSProperties & CssVariables

// Returns the variables as a style object. The literal is checked against the variable type where it is written.
export function styleWithVariables(variables: CssVariables): StyleWithVariables {
  return variables
}
