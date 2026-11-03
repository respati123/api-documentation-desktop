import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

// Only the app's own pages may call the main process. In development that is the renderer dev server, and in a packaged build it is the bundled file:// page.
export function assertTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url ?? ''
  if (!isTrustedPage(senderUrl)) throw new Error('Refused a call from an untrusted page.')
}

// True for the app's own pages: the renderer dev server in development, the bundled file:// page when packaged.
export function isTrustedPage(url: string): boolean {
  try {
    const sender = new URL(url)
    const rendererUrl = process.env.ELECTRON_RENDERER_URL
    return rendererUrl ? sender.origin === new URL(rendererUrl).origin : sender.protocol === 'file:'
  } catch {
    return false
  }
}
