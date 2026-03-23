import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: '音声ファイルがありません' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ja',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[transcribe] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
