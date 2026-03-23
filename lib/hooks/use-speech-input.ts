'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'unsupported'

interface UseSpeechInputOptions {
  /** 認識テキストを受け取るコールバック（確定のみ） */
  onResult: (text: string) => void
  /** 暫定テキストを受け取るコールバック（リアルタイム表示用・任意） */
  onInterim?: (text: string) => void
  lang?: string
}

export function useSpeechInput({ onResult, onInterim, lang = 'ja-JP' }: UseSpeechInputOptions) {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const stoppingRef = useRef(false)

  // ブラウザサポートチェック
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported')
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (recognitionRef.current && !stoppingRef.current) {
      stoppingRef.current = true
      recognitionRef.current.stop()
    }
  }, [])

  const start = useCallback(() => {
    if (!isSupported) return
    if (status === 'listening') {
      stop()
      return
    }

    const SpeechRecognitionClass =
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ??
      window.SpeechRecognition

    const recognition = new SpeechRecognitionClass()
    recognition.lang = lang
    recognition.continuous = true      // 長い発話も継続して認識
    recognition.interimResults = true  // 暫定テキストも取得

    recognition.onstart = () => {
      stoppingRef.current = false
      setStatus('listening')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          onResult(result[0].transcript)
        } else {
          interim += result[0].transcript
        }
      }
      if (onInterim) onInterim(interim)
    }

    recognition.onerror = () => {
      setStatus('idle')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setStatus('idle')
      recognitionRef.current = null
      if (onInterim) onInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, status, lang, onResult, onInterim, stop])

  // アンマウント時に停止
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        stoppingRef.current = true
        recognitionRef.current.abort()
      }
    }
  }, [])

  return { status, start, stop, isSupported }
}
