'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onStop: (blob: Blob, audioUrl: string, transcript: string) => void;
  onStart?: () => void;
  parentState?: 'idle' | 'recording' | 'evaluating' | 'graded';
}

export default function AudioRecorder({ onStop, onStart, parentState }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  // Reset state when parent returns to idle
  useEffect(() => {
    if (parentState === 'idle') {
      setAudioUrl(null);
      setDuration(0);
      setIsRecording(false);
    }
  }, [parentState]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setDuration(0);
    transcriptRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onStop(audioBlob, url, transcriptRef.current);
      };

      // Set up Audio Visualizer
      setupVisualizer(stream);

      // Set up local speech recognition for mock/offline fallback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = false;
          rec.lang = 'en-US';
          
          rec.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            transcriptRef.current += (transcriptRef.current ? ' ' : '') + finalTranscript;
          };
          
          rec.onerror = (e: any) => {
            console.error('Local speech recognition error', e);
          };
          
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.error('Failed to initialize local speech recognition', e);
        }
      }

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      if (onStart) onStart();

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error opening microphone', err);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopRecordingCleanup();
    }
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      recognitionRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const setupVisualizer = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    drawWaveform();
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Custom premium neon equalizer bars drawing
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#06b6d4');

        ctx.fillStyle = grad;
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 2);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', justifyContent: 'center' }}>
        {/* Record Control Button */}
        {isRecording ? (
          <button 
            onClick={stopRecording} 
            className="pulse-primary"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--error)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(244, 63, 94, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '4px' }} />
          </button>
        ) : (
          <button 
            onClick={startRecording}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '0', 
              height: '0', 
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '16px solid white',
              marginLeft: '4px'
            }} />
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {isRecording ? 'Recording Voice...' : 'Click to Speak'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isRecording ? `Duration: ${formatTime(duration)}` : 'Ready to record audio'}
          </span>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <canvas 
        ref={canvasRef} 
        width="350" 
        height="80" 
        style={{ 
          width: '100%', 
          maxHeight: '80px', 
          background: 'rgba(0,0,0,0.1)', 
          borderRadius: 'var(--radius-sm)',
          display: isRecording ? 'block' : 'none'
        }}
      />

      {/* Audio Playback Player */}
      {audioUrl && !isRecording && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preview your response:</span>
          <audio src={audioUrl} controls style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
}
