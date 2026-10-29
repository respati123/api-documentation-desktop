import type { ReactNode } from 'react'

// A label with its text above a control. The class name sets the layout for each form.
export function LabeledField({ className, label, children }: { className: string; label: ReactNode; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children, which the rule cannot see
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  )
}
