import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * テキストを OpenAI Embeddings API でベクトル化する
 * モデル: text-embedding-3-small（1536次元）
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text.trim()) {
    // 空テキストはゼロベクトルを返す
    return new Array(1536).fill(0)
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}
