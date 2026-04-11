import { useState, useRef, useCallback, useEffect } from 'react';
import { emitEvent } from '../services/socket';

const synth = window.speechSynthesis;

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // Check microphone permission
  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' }).then(result => {
      setHasPermission(result.state === 'granted');
      result.onchange = () => setHasPermission(result.state === 'granted');
    }).catch(() => setHasPermission(null));
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => {
      setError(`Voice error: ${e.error}`);
      setIsListening(false);
      emitEvent('voice:stop');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      emitEvent('voice:stop');
    };

    return recognition;
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
    } catch {
      setHasPermission(false);
      setError('Microphone permission denied');
      return;
    }

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    emitEvent('voice:start');
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    emitEvent('voice:stop');
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!synth) return;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick a natural English voice
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || (v.lang === 'en-US' && !v.name.includes('Microsoft')));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setIsSpeaking(true);
      emitEvent('tts:start');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      emitEvent('tts:stop');
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      emitEvent('tts:stop');
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synth?.cancel();
    setIsSpeaking(false);
    emitEvent('tts:stop');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    hasPermission,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    fullTranscript: transcript + interimTranscript,
    isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}
