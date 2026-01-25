"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  appendMode?: boolean;
  size?: "sm" | "md" | "lg";
}

// Singleton for the Whisper pipeline to avoid reloading the model
let whisperPipeline: any = null;
let pipelineLoading = false;
let pipelineLoadPromise: Promise<any> | null = null;

async function getWhisperPipeline() {
  if (whisperPipeline) {
    return whisperPipeline;
  }

  if (pipelineLoading && pipelineLoadPromise) {
    return pipelineLoadPromise;
  }

  pipelineLoading = true;
  pipelineLoadPromise = (async () => {
    try {
      const { pipeline } = await import("@xenova/transformers");
      console.log("[Whisper] Loading model... This may take a moment on first use.");
      whisperPipeline = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small"
      );
      console.log("[Whisper] Model loaded successfully!");
      return whisperPipeline;
    } catch (error) {
      console.error("[Whisper] Failed to load model:", error);
      pipelineLoading = false;
      pipelineLoadPromise = null;
      throw error;
    }
  })();

  return pipelineLoadPromise;
}

// Animated sound wave bars component
function SoundWaveAnimation({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] bg-white rounded-full transition-all duration-150",
            isActive ? "animate-soundwave" : "h-1"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isActive ? undefined : "4px",
          }}
        />
      ))}
    </div>
  );
}

// Pulsing ring animation for recording
function PulsingRings() {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
      <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-20" />
    </>
  );
}

export function VoiceInput({
  onTranscript,
  disabled = false,
  className,
  appendMode = true,
  size = "md",
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setError("No audio recorded");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      
    } catch (err) {
      console.error("[VoiceInput] Error starting recording:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to start recording");
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setIsModelLoading(true);
    
    try {
      const transcriber = await getWhisperPipeline();
      setIsModelLoading(false);
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);
      
      console.log("[Whisper] Transcribing audio...");
      const result = await transcriber(audioData, {
        language: "english",
        task: "transcribe",
      });
      
      console.log("[Whisper] Transcription result:", result);
      
      if (result && result.text) {
        const transcribedText = result.text.trim();
        if (transcribedText) {
          onTranscript(transcribedText);
        }
      }
      
      await audioContext.close();
      
    } catch (err) {
      console.error("[Whisper] Transcription error:", err);
      setError(err instanceof Error ? err.message : "Failed to transcribe");
    } finally {
      setIsTranscribing(false);
      setIsModelLoading(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isProcessing = isTranscribing || isModelLoading;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
          isRecording
            ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 focus:ring-red-500 hover:from-red-600 hover:to-red-700"
            : isProcessing
            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
            : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 focus:ring-emerald-500"
        )}
        title={
          isProcessing
            ? isModelLoading
              ? "Loading AI model..."
              : "Transcribing..."
            : isRecording
            ? "Stop recording"
            : "Start voice input"
        }
      >
        {/* Pulsing rings when recording */}
        {isRecording && <PulsingRings />}
        
        {/* Icon content */}
        <span className="relative z-10">
          {isProcessing ? (
            // Spinner for processing
            <svg
              className={cn("animate-spin", iconSizes[size])}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isRecording ? (
            // Sound wave animation when recording
            <SoundWaveAnimation isActive={true} />
          ) : (
            // Microphone icon
            <svg
              className={iconSizes[size]}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </span>
      </button>
      
      {/* Status badge */}
      {(isRecording || isProcessing) && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium animate-in fade-in slide-in-from-left-2 duration-300",
            isRecording
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}
        >
          {isRecording ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span>Recording {formatDuration(recordingDuration)}</span>
            </>
          ) : isModelLoading ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading AI...</span>
            </>
          ) : (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Transcribing...</span>
            </>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs animate-in fade-in slide-in-from-left-2 dark:bg-red-900/30 dark:text-red-400">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Wrapper component that combines a textarea with voice input
interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function VoiceTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  disabled,
  className,
}: VoiceTextareaProps) {
  const handleTranscript = (text: string) => {
    const newValue = value ? `${value} ${text}` : text;
    onChange(newValue);
  };

  return (
    <div className="relative group">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 pr-14 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all",
          "hover:border-emerald-300 focus:border-emerald-400",
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
      />
      <div className="absolute right-2 top-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <VoiceInput onTranscript={handleTranscript} disabled={disabled} size="md" />
      </div>
    </div>
  );
}

// Wrapper component for input with voice
interface VoiceInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputField({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: VoiceInputFieldProps) {
  const handleTranscript = (text: string) => {
    const newValue = value ? `${value} ${text}` : text;
    onChange(newValue);
  };

  return (
    <div className="relative flex items-center gap-2 group">
      <input
        type="text"
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          "hover:border-emerald-300 focus:border-emerald-400",
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="opacity-80 group-hover:opacity-100 transition-opacity">
        <VoiceInput onTranscript={handleTranscript} disabled={disabled} size="sm" />
      </div>
    </div>
  );
}

// Medication parsing utilities
interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

function parseMedicationFromText(text: string): ParsedMedication {
  const result: ParsedMedication = {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  };
  
  if (!text || text.trim().length === 0) {
    console.log("[MedicationParser] Empty input");
    return result;
  }
  
  // Step 1: NORMALIZE the text
  let normalized = text
    .toLowerCase()
    .trim()
    // Fix common speech-to-text issues
    .replace(/milligrams?/gi, "mg")
    .replace(/grams?/gi, "g")
    .replace(/milliliters?/gi, "ml")
    .replace(/micrograms?/gi, "mcg")
    // Normalize spacing
    .replace(/\s+/g, " ")
    // Remove punctuation except periods in numbers
    .replace(/[,;:!?]/g, " ");
  
  console.log("[MedicationParser] Input:", text);
  console.log("[MedicationParser] Normalized:", normalized);
  
  let remaining = normalized;
  
  // Step 2: Extract DURATION first (prevents "5 days" from being caught as dosage)
  const durationPatterns = [
    /\bfor\s+(\d+)\s*(days?|weeks?|months?|years?)\b/i,
    /\b(\d+)\s*(days?|weeks?|months?|years?)\b/i,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(days?|weeks?|months?)\b/i,
  ];
  
  for (const pattern of durationPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      // For "for X days" pattern, capture just "X days"
      if (match[0].startsWith("for ")) {
        result.duration = match[0].substring(4).trim();
      } else {
        result.duration = match[0].trim();
      }
      remaining = remaining.replace(match[0], " ").trim();
      console.log("[MedicationParser] Found duration:", result.duration);
      break;
    }
  }
  
  // Step 3: Extract FREQUENCY (order matters - check longer patterns first)
  const frequencyPatterns = [
    // Specific patterns first
    { pattern: /\btwice\s+(?:a\s+)?daily\b/i, value: "twice daily" },
    { pattern: /\btwice\s+a\s+day\b/i, value: "twice daily" },
    { pattern: /\btwice\s+per\s+day\b/i, value: "twice daily" },
    { pattern: /\btwo\s+times\s+(?:a\s+)?day\b/i, value: "twice daily" },
    { pattern: /\b2\s+times\s+(?:a\s+)?day\b/i, value: "twice daily" },
    { pattern: /\bonce\s+(?:a\s+)?daily\b/i, value: "once daily" },
    { pattern: /\bonce\s+a\s+day\b/i, value: "once daily" },
    { pattern: /\bonce\s+per\s+day\b/i, value: "once daily" },
    { pattern: /\bthree\s+times\s+(?:a\s+)?day\b/i, value: "three times daily" },
    { pattern: /\b3\s+times\s+(?:a\s+)?day\b/i, value: "three times daily" },
    { pattern: /\bthrice\s+daily\b/i, value: "three times daily" },
    { pattern: /\bfour\s+times\s+(?:a\s+)?day\b/i, value: "four times daily" },
    { pattern: /\b4\s+times\s+(?:a\s+)?day\b/i, value: "four times daily" },
    { pattern: /\bevery\s+(\d+)\s+hours?\b/i, value: null }, // Keep original
    { pattern: /\bat\s+(?:bed\s*time|night)\b/i, value: "at bedtime" },
    { pattern: /\bin\s+the\s+morning\b/i, value: "in the morning" },
    { pattern: /\bafter\s+(?:meals?|food|eating)\b/i, value: "after meals" },
    { pattern: /\bbefore\s+(?:meals?|food|eating)\b/i, value: "before meals" },
    { pattern: /\bwith\s+(?:meals?|food)\b/i, value: "with meals" },
    { pattern: /\bas\s+needed\b/i, value: "as needed" },
    { pattern: /\bprn\b/i, value: "as needed" },
    // Generic - must be last
    { pattern: /\bdaily\b/i, value: "once daily" },
  ];
  
  for (const { pattern, value } of frequencyPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      result.frequency = value || match[0].trim();
      remaining = remaining.replace(match[0], " ").trim();
      console.log("[MedicationParser] Found frequency:", result.frequency);
      break;
    }
  }
  
  // Step 4: Extract DOSAGE (number + unit)
  const dosagePatterns = [
    /\b(\d+\.?\d*)\s*(mg|g|ml|mcg|iu)\b/i,
    /\b(\d+\.?\d*)\s*(tablets?|tabs?)\b/i,
    /\b(\d+\.?\d*)\s*(capsules?|caps?)\b/i,
    /\b(\d+\.?\d*)\s*(pills?)\b/i,
    /\b(\d+\.?\d*)\s*(drops?)\b/i,
    /\b(\d+\.?\d*)\s*(puffs?|sprays?)\b/i,
    /\b(\d+\.?\d*)\s*(units?)\b/i,
  ];
  
  for (const pattern of dosagePatterns) {
    const match = remaining.match(pattern);
    if (match) {
      result.dosage = match[0].trim();
      remaining = remaining.replace(match[0], " ").trim();
      console.log("[MedicationParser] Found dosage:", result.dosage);
      break;
    }
  }
  
  // Step 5: Extract DRUG NAME (whatever meaningful words remain)
  const stopWords = new Set([
    "for", "and", "the", "a", "an", "take", "give", "to", "of", "with",
    "please", "prescribe", "prescription", "medicine", "medication", "drug",
    "i", "need", "want", "get", "me", "my", "patient"
  ]);
  
  const nameWords = remaining
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word) && !/^\d+$/.test(word))
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
  
  if (nameWords) {
    result.name = nameWords;
    console.log("[MedicationParser] Found name:", result.name);
  }
  
  console.log("[MedicationParser] Final result:", result);
  
  return result;
}

// Smart medication voice input component
interface VoiceMedicationInputProps {
  medication: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  };
  onUpdate: (field: "name" | "dosage" | "frequency" | "duration", value: string) => void;
  disabled?: boolean;
}

export function VoiceMedicationInput({
  medication,
  onUpdate,
  disabled,
}: VoiceMedicationInputProps) {
  const [lastTranscript, setLastTranscript] = React.useState<string>("");
  
  const handleTranscript = (text: string) => {
    console.log("[VoiceMedicationInput] Raw transcript received:", JSON.stringify(text));
    setLastTranscript(text);
    
    const parsed = parseMedicationFromText(text);
    
    console.log("[VoiceMedicationInput] Parsed result:", parsed);
    
    // Update all fields that were parsed
    if (parsed.name) onUpdate("name", parsed.name);
    if (parsed.dosage) onUpdate("dosage", parsed.dosage);
    if (parsed.frequency) onUpdate("frequency", parsed.frequency);
    if (parsed.duration) onUpdate("duration", parsed.duration);
  };

  return (
    <div className="space-y-3">
      {/* Voice input row */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <VoiceInput onTranscript={handleTranscript} disabled={disabled} size="md" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Speak the full prescription
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            e.g., "Paracetamol 500mg twice daily for 5 days"
          </p>
        </div>
      </div>
      
      {/* Debug: Show what was transcribed */}
      {lastTranscript && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
          <span className="font-medium text-yellow-800 dark:text-yellow-200">Heard: </span>
          <span className="text-yellow-700 dark:text-yellow-300">"{lastTranscript}"</span>
        </div>
      )}
      
      {/* Manual input fields */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-emerald-300 focus:border-emerald-400"
          placeholder="Drug name *"
          value={medication.name}
          onChange={(e) => onUpdate("name", e.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-emerald-300 focus:border-emerald-400"
          placeholder="Dosage *"
          value={medication.dosage}
          onChange={(e) => onUpdate("dosage", e.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-emerald-300 focus:border-emerald-400"
          placeholder="Frequency *"
          value={medication.frequency}
          onChange={(e) => onUpdate("frequency", e.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-emerald-300 focus:border-emerald-400"
          placeholder="Duration"
          value={medication.duration}
          onChange={(e) => onUpdate("duration", e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
