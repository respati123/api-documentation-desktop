import { type PickedFile, pickedFileSchema } from '@/features/request/models/request.model'
import { apiResponseSchema, type ResponseData } from '@/features/response'
import { type ScriptRunInput, type ScriptRunResult, scriptRunResultSchema } from '@/shared/ipc/script-contract'

// The only place the renderer sends requests or opens the file picker through the main process.
export const requestService = {
  send: async (request: ApiRequest): Promise<ResponseData> => apiResponseSchema.parse(await window.apiDesktop.sendRequest(request)),

  // Runs one script in the main process. The result is checked before the renderer uses it.
  runScript: async (input: ScriptRunInput): Promise<ScriptRunResult> =>
    scriptRunResultSchema.parse(await window.apiDesktop.runScript(input)),

  selectFile: async (): Promise<PickedFile | null> => {
    const file = await window.apiDesktop.selectFile()
    return file === null ? null : pickedFileSchema.parse(file)
  },
}
