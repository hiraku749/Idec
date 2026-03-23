'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      saveVoiceNote: (text: string) => Promise<unknown>
      closeVoiceOverlay: () => void
    }
  }
}

type Status = 'recording' | 'transcribing' | 'done' | 'error'

export default function VoiceOverlay() {
  const [status, setStatus] = useState<Status>('recording')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        chunksRef.current = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.start(100)
      } catch (e) {
        setError('マイクにアクセスできません: ' + String(e))
        setStatus('error')
      }
    }
    void startRecording()

    return () => {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function save() {
    const recorder = mediaRecorderRef.current
    if (!recorder) { doClose(); return }

    setStatus('transcribing')
    setText('録音を停止中...')
    recorder.stop()

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })

    streamRef.current?.getTracks().forEach((t) => t.stop())

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    setText(`録音サイズ: ${blob.size} bytes — Whisper送信中...`)

    if (blob.size < 100) {
      setError(`録音失敗 (size=${blob.size}). マイク許可を確認してください`)
      setStatus('error')
      return
    }

    const formData = new FormData()
    formData.append('audio', blob, 'audio.webm')

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const json = await res.json() as { text?: string; error?: string }
      setText(`結果: ${JSON.stringify(json)}`)
      if (!json.text) {
        setError(`テキストなし: ${JSON.stringify(json)}`)
        setStatus('error')
        return
      }
      await window.electronAPI?.saveVoiceNote(json.text)
    } catch (e) {
      setError(`エラー: ${String(e)}`)
      setStatus('error')
      return
    }

    doClose()
  }

  function doClose() {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    window.electronAPI?.closeVoiceOverlay()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') void save()
      if (e.key === 'Escape') doClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const statusLabel = {
    recording: '録音中',
    transcribing: '文字起こし中...',
    done: '完了',
    error: 'エラー',
  }[status]

  const dotColor = status === 'recording' ? '#ef4444' : status === 'transcribing' ? '#f59e0b' : '#6b7280'

  return (
    <div style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div style={{
        background: 'rgba(15,15,15,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: '16px 20px',
        margin: 8,
        color: '#fff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif",
        userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: dotColor,
              animation: status === 'recording' ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            {statusLabel}
          </div>
          <button onClick={doClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 20, height: 20, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}>✕</button>
        </div>

        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.6)', minHeight: 36, lineHeight: 1.5,
          background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', marginBottom: 10,
        }}>
          {error
            ? <span style={{ color: '#ef4444' }}>{error}</span>
            : text || (status === 'recording' ? '話してください...' : status === 'transcribing' ? '文字起こし中...' : '')}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={doClose} style={{
            border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
          }}>キャンセル</button>
          <button
            onClick={() => void save()}
            disabled={status !== 'recording'}
            style={{
              border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 500,
              cursor: status === 'recording' ? 'pointer' : 'default',
              background: status === 'recording' ? '#3b82f6' : '#374151', color: '#fff',
            }}>保存 (Enter)</button>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Enter で保存 / Esc でキャンセル
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:transparent}
      `}</style>
    </div>
  )
}
