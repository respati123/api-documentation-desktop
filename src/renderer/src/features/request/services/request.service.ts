import { type PickedFile, pickedFileSchema } from '@/features/request/models/request.model'
import { apiResponseSchema, type ResponseData } from '@/features/response'

// The only place the renderer sends requests or opens the file picker through the main process.
export const requestService = {
  send: async (request: ApiRequest): Promise<ResponseData> => apiResponseSchema.parse(await window.apiDesktop.sendRequest(request)),

  selectFile: async (): Promise<PickedFile | null> => {
    const file = await window.apiDesktop.selectFile()
    return file === null ? null : pickedFileSchema.parse(file)
  },
}
