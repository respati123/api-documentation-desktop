import './MethodTag.css'

// The common methods have their own colors. Any other method (HEAD, OPTIONS, ...) shows its name in the default color.
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | (string & {})

export interface MethodTagProps {
  method: HttpMethod
}

// DELETE is shortened to DEL in lists, as the desktop app does.
export function MethodTag({ method }: MethodTagProps) {
  const label = method === 'DELETE' ? 'DEL' : method
  const known = ['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())
  return <span className={`method-tag${known ? ` method-tag--${method.toLowerCase()}` : ''}`}>{label}</span>
}
