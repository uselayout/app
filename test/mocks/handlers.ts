import { http, HttpResponse } from 'msw'

export const handlers = [
  // Figma API — default empty responses
  http.get('https://api.figma.com/v1/files/:fileKey', () => {
    return HttpResponse.json({
      name: 'Test File',
      lastModified: '2026-01-01T00:00:00Z',
      document: { id: '0:0', name: 'Document', type: 'DOCUMENT', children: [] },
      styles: {},
    })
  }),

  http.get('https://api.figma.com/v1/files/:fileKey/styles', () => {
    return HttpResponse.json({ status: 200, error: false, meta: { styles: [] } })
  }),

  http.get('https://api.figma.com/v1/files/:fileKey/nodes', () => {
    return HttpResponse.json({ nodes: {} })
  }),

  // Anthropic API — mock streaming response
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Mock response' }],
      model: 'claude-sonnet-4-6',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    })
  }),
]
