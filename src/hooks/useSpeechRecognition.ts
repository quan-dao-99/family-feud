import { useState, useEffect, useRef, useCallback } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEventInit {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventInit) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'vi-VN',
    continuous = true, // Default to continuous to prevent Chrome from auto-killing after 1s
    interimResults = true,
    silenceTimeoutMs = 1200, // Auto-finalize after 1.2s of silence following speech
    onResult,
    onError,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const isFinalProcessedRef = useRef(false);

  // Audio level meter stream & context
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Store latest callbacks in refs
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onEndRef.current = onEnd;
  });

  // Start real-time audio volume analyzer
  const startAudioMeter = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize 0 - 100 with boosted sensitivity
        const normalized = Math.min(100, Math.round((average / 128) * 100 * 1.6));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // Audio meter is non-fatal fallback
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const finalizeSpeech = useCallback((textToFinalize: string) => {
    const cleanText = textToFinalize.trim();
    if (cleanText && !isFinalProcessedRef.current) {
      isFinalProcessedRef.current = true;
      setTranscript(cleanText);
      setInterimTranscript('');
      if (onResultRef.current) {
        onResultRef.current(cleanText, true);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // If there is any remaining unfinalized speech, finalize it now
    if (latestTranscriptRef.current && !isFinalProcessedRef.current) {
      finalizeSpeech(latestTranscriptRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    stopAudioMeter();
    setIsListening(false);
  }, [finalizeSpeech, stopAudioMeter]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    latestTranscriptRef.current = '';
    isFinalProcessedRef.current = false;
    setError(null);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      if (!isSupported) {
        const err = 'Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Google Chrome, Microsoft Edge hoặc Safari.';
        setError(err);
        if (onErrorRef.current) onErrorRef.current(err);
        return;
      }

      // If already listening, stop previous session cleanly
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }

      isManuallyStoppedRef.current = false;
      isFinalProcessedRef.current = false;
      latestTranscriptRef.current = '';
      setError(null);
      setTranscript('');
      setInterimTranscript('');

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      try {
        const SpeechRecConstructor =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecConstructor) return;

        const recognition = new SpeechRecConstructor();
        recognition.lang = customLang || lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          startAudioMeter();
        };

        recognition.onresult = (event: SpeechRecognitionEventInit) => {
          let currentInterim = '';
          let finalResult = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultItem = event.results[i];
            const text = resultItem[0]?.transcript || '';

            if (resultItem.isFinal) {
              finalResult += text;
            } else {
              currentInterim += text;
            }
          }

          const currentSpoken = (finalResult || currentInterim || '').trim();

          if (currentSpoken) {
            latestTranscriptRef.current = currentSpoken;
            isFinalProcessedRef.current = false;

            if (finalResult) {
              setTranscript(finalResult.trim());
              setInterimTranscript('');
              finalizeSpeech(finalResult.trim());
            } else {
              setInterimTranscript(currentInterim.trim());
              if (onResultRef.current) {
                onResultRef.current(currentInterim.trim(), false);
              }

              // Auto-finalize interim after silence timeout
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }
              silenceTimerRef.current = window.setTimeout(() => {
                if (latestTranscriptRef.current && !isFinalProcessedRef.current) {
                  finalizeSpeech(latestTranscriptRef.current);
                }
              }, silenceTimeoutMs);
            }
          }
        };

        recognition.onerror = (event: { error: string; message?: string }) => {
          // 'no-speech' is a normal silence event in Web Speech API; do NOT treat as fatal
          if (event.error === 'no-speech') {
            // If user has spoken something previously, finalize it
            if (latestTranscriptRef.current && !isFinalProcessedRef.current) {
              finalizeSpeech(latestTranscriptRef.current);
            }
            return;
          }

          let errorMsg = `Lỗi nhận diện giọng nói: ${event.error}`;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMsg = 'Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền Microphone trên thanh địa chỉ của trình duyệt.';
          } else if (event.error === 'network') {
            errorMsg = 'Lỗi kết nối tới máy chủ Google Speech. Vui lòng kiểm tra kết nối mạng/VPN.';
          } else if (event.error === 'aborted') {
            // Ignored if abort was intentional
            return;
          }

          setError(errorMsg);
          if (onErrorRef.current) {
            onErrorRef.current(errorMsg);
          }
        };

        recognition.onend = () => {
          // If ended with unfinalized speech, finalize now
          if (latestTranscriptRef.current && !isFinalProcessedRef.current) {
            finalizeSpeech(latestTranscriptRef.current);
          }

          // If not manually stopped and we're in continuous listening mode without error, restart seamlessly
          if (!isManuallyStoppedRef.current && !isFinalProcessedRef.current) {
            try {
              recognition.start();
              return;
            } catch {
              // Ignore restart error
            }
          }

          setIsListening(false);
          stopAudioMeter();
          if (onEndRef.current) {
            onEndRef.current();
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        const errorMsg = `Không thể khởi động Microphone: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMsg);
        setIsListening(false);
        stopAudioMeter();
        if (onErrorRef.current) onErrorRef.current(errorMsg);
      }
    },
    [isSupported, lang, continuous, interimResults, silenceTimeoutMs, startAudioMeter, finalizeSpeech, stopAudioMeter]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      stopAudioMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [stopAudioMeter]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioLevel, // Live volume meter (0 to 100)
    startListening,
    stopListening,
    resetTranscript,
  };
}
