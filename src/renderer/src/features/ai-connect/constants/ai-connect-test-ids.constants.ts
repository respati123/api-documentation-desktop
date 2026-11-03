export const AI_CONNECT_TEST_IDS = {
  dialog: 'ai-connect-dialog-container',
  nodeInstall: 'ai-connect-node-install-button',
  toolInstall: (id: string) => `ai-connect-tool-install-button-${id}`,
  toolConnect: (id: string) => `ai-connect-tool-connect-button-${id}`,
  error: 'ai-connect-dialog-error',
  log: 'ai-connect-dialog-log',
} as const
