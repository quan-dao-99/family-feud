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
    continuous = true,
    interimResults = true,
    silenceTimeoutMs = 1000, // Auto-finalize after 1.0s of silence following speech
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
  const isRestartingRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const lastFinalizedTextRef = useRef<string>('');

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

  // Start real-time audio volume analyzer safely
  const startAudioMeter = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    if (mediaStreamRef.current) return; // Already running

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Handle suspended audio context on user interaction policies
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
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
        // Normalize 0 - 100 with boosted sensitivity for clear visual feedback
        const normalized = Math.min(100, Math.round((average / 128) * 100 * 1.8));
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
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
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

  // Finalize speech and trigger callback
  const finalizeSpeech = useCallback((textToFinalize: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const cleanText = textToFinalize.trim();
    if (!cleanText) return;

    // Prevent immediate duplicate firing of the exact same string in one burst
    if (cleanText === lastFinalizedTextRef.current) return;
    lastFinalizedTextRef.current = cleanText;

    setTranscript(cleanText);
    setInterimTranscript('');
    latestTranscriptRef.current = '';

    if (onResultRef.current) {
      onResultRef.current(cleanText, true);
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    isRestartingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // If there is any remaining unfinalized interim speech, finalize it now
    if (latestTranscriptRef.current) {
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
    lastFinalizedTextRef.current = '';
    setError(null);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      if (!isSupported) {
        const err =
          'Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Google Chrome, Microsoft Edge hoặc Safari.';
        setError(err);
        if (onErrorRef.current) onErrorRef.current(err);
        return;
      }

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
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
      isRestartingRef.current = false;
      latestTranscriptRef.current = '';
      lastFinalizedTextRef.current = '';
      setError(null);
      setTranscript('');
      setInterimTranscript('');

      try {
        const SpeechRecConstructor =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecConstructor) return;

        const isMobile =
          typeof navigator !== 'undefined' &&
          /android|iphone|ipad|ipod/i.test(navigator.userAgent);

        const recognition = new SpeechRecConstructor();
        recognition.lang = customLang || lang;
        // On Android/mobile, native SpeechRecognizer works best with single-phrase per turn with seamless restart on onend
        recognition.continuous = isMobile ? false : continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          isRestartingRef.current = false;
          // Avoid opening a concurrent getUserMedia stream on mobile to prevent Android audio HAL hardware contention
          if (!isMobile) {
            startAudioMeter();
          } else {
            setAudioLevel(40);
          }
        };

        recognition.onresult = (event: SpeechRecognitionEventInit) => {
          let currentInterim = '';
          let currentFinal = '';

          // Process the results from resultIndex
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultItem = event.results[i];
            const text = resultItem[0]?.transcript || '';

            if (resultItem.isFinal) {
              currentFinal += (currentFinal ? ' ' : '') + text;
            } else {
              currentInterim += (currentInterim ? ' ' : '') + text;
            }
          }

          const activeSpoken = (currentFinal || currentInterim || '').trim();

          if (activeSpoken) {
            latestTranscriptRef.current = activeSpoken;

            if (currentFinal) {
              finalizeSpeech(currentFinal.trim());
            } else if (currentInterim) {
              const cleanInterim = currentInterim.trim();
              setInterimTranscript(cleanInterim);
              if (onResultRef.current) {
                onResultRef.current(cleanInterim, false);
              }

              // Auto-finalize interim after silence timeout
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }
              silenceTimerRef.current = window.setTimeout(() => {
                if (latestTranscriptRef.current) {
                  finalizeSpeech(latestTranscriptRef.current);
                }
              }, silenceTimeoutMs);
            }
          }
        };

        recognition.onerror = (event: { error: string; message?: string }) => {
          // 'no-speech' is a normal silence event in Web Speech API; do NOT treat as fatal
          if (event.error === 'no-speech') {
            if (latestTranscriptRef.current) {
              finalizeSpeech(latestTranscriptRef.current);
            }
            return;
          }

          if (event.error === 'aborted') {
            // Ignored if abort was intentional or restarting
            return;
          }

          let errorMsg = `Lỗi nhận diện giọng nói: ${event.error}`;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMsg =
              'Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền Microphone trên thanh địa chỉ của trình duyệt.';
          } else if (event.error === 'network') {
            errorMsg =
              'Lỗi kết nối tới máy chủ Google Speech. Vui lòng kiểm tra kết nối mạng/VPN.';
          }

          setError(errorMsg);
          if (onErrorRef.current) {
            onErrorRef.current(errorMsg);
          }
        };

        recognition.onend = () => {
          // If ended with unfinalized speech, finalize now
          if (latestTranscriptRef.current) {
            finalizeSpeech(latestTranscriptRef.current);
          }

          // If in continuous mode and not manually stopped, restart seamlessly
          if (!isManuallyStoppedRef.current && continuous) {
            isRestartingRef.current = true;
            if (restartTimerRef.current) {
              clearTimeout(restartTimerRef.current);
            }
            restartTimerRef.current = window.setTimeout(() => {
              if (!isManuallyStoppedRef.current) {
                try {
                  recognition.start();
                } catch {
                  // If restart fails, create a fresh instance
                  startListening(customLang || lang);
                }
              }
            }, 80);
            return;
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
    [
      isSupported,
      lang,
      continuous,
      interimResults,
      silenceTimeoutMs,
      startAudioMeter,
      finalizeSpeech,
      stopAudioMeter,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
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

