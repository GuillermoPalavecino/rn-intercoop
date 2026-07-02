interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LLMOptions {
  temperature?: number
  max_tokens?: number
}

function buildRequest(messages: ChatMessage[], options?: LLMOptions, stream = false) {
  const baseUrl = process.env.CUSTOM_LLM_URL
  const apiKey = process.env.CUSTOM_LLM_API_KEY
  const model = process.env.CUSTOM_LLM_MODEL ?? 'qwen3.6:35b'

  if (!baseUrl) throw new Error('CUSTOM_LLM_URL no está configurado en .env.local')

  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : baseUrl.replace(/\/$/, '') + '/chat/completions'

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const body = JSON.stringify({
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1024,
    stream,
  })

  return { url, headers, body }
}

// Respuesta completa (no streaming)
export async function chatCompletion(messages: ChatMessage[], options?: LLMOptions): Promise<{ content: string }> {
  const { url, headers, body } = buildRequest(messages, options, false)

  const res = await fetch(url, { method: 'POST', headers, body })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LLM error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''
  return { content }
}

// Streaming: yields texto a medida que llega
export async function* chatCompletionStream(
  messages: ChatMessage[],
  options?: LLMOptions
): AsyncGenerator<string> {
  const { url, headers, body } = buildRequest(messages, options, true)

  const res = await fetch(url, { method: 'POST', headers, body })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LLM error ${res.status}: ${text}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // guardar línea incompleta para el próximo chunk

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const json = JSON.parse(data)
        const token: string = json.choices?.[0]?.delta?.content ?? ''
        if (token) yield token
      } catch {
        // línea SSE mal formada, ignorar
      }
    }
  }
}
