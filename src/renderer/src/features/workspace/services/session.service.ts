import { z } from 'zod'

// Desktop sign-in state. The token is held by the main process, never by the renderer.
export const sessionService = {
  load: async (): Promise<string | null> =>
    z
      .string()
      .nullable()
      .parse(await window.apiDesktop.loadSession()),

  save: async (token: string): Promise<boolean> => z.boolean().parse(await window.apiDesktop.saveSession(token)),

  clear: async (): Promise<void> => {
    await window.apiDesktop.clearSession()
  },

  beginBrowserSignIn: async (cloudUrl: string): Promise<void> => {
    await window.apiDesktop.beginBrowserSignIn(cloudUrl)
  },

  onAuthSession: (handler: (token: string) => void): (() => void) => window.apiDesktop.onAuthSession(handler),

  onAuthFailed: (handler: (reason: string) => void): (() => void) => window.apiDesktop.onAuthFailed(handler),

  onInviteToken: (handler: (token: string) => void): (() => void) => window.apiDesktop.onInviteToken(handler),
}
