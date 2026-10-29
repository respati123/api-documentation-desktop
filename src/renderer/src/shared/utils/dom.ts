// Narrowing guards for DOM nodes. They replace casts, so the checks the code relies on are visible in the type.
export function isHtmlElement(node: EventTarget | Node | null | undefined): node is HTMLElement {
  return node instanceof HTMLElement
}

// A variable token rendered in the request editor. Its dataset carries the variable's name and value.
export function isVariableToken(node: EventTarget | Node | null | undefined): node is HTMLElement {
  return isHtmlElement(node) && node.dataset.variableToken === 'true'
}
