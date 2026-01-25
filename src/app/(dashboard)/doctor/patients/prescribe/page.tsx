'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Send, Loader } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PrescribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [medications, setMedications] = useState<any[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      await processAudio(audioBlob);
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!patientId) {
      alert('Patient ID not found');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'prescription-audio.wav');
    formData.append('patientId', patientId);

    try {
      const response = await fetch('/api/doctor/prescriptions/voice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTranscription(data.transcription);
        setMedications(data.parsed.medications);
        setAdditionalNotes(data.parsed.additionalNotes);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to process audio');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPrescription = async () => {
    if (!patientId || medications.length === 0) {
      alert('Please complete the prescription first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          medications,
          instructions: additionalNotes,
        }),
      });

      if (response.ok) {
        alert('Prescription sent to pharmacy successfully!');
        router.push('/doctor/prescriptions');
      } else {
        alert('Failed to submit prescription');
      }
    } catch (error) {
      alert('Error submitting prescription');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || !patientId) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Create Prescription</h1>
        <p className="text-gray-600">Use voice to describe medications and instructions</p>
      </div>

      {/* Voice Recording Section */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Voice Input</h2>
            <p className="text-gray-600 text-sm">Speak the medications, dosages, frequency, and instructions</p>
          </div>

          <div className="flex justify-center items-center gap-4">
            {isRecording ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-mono font-semibold text-red-600">
                    {Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            ) : (
              <Button
                onClick={startRecording}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}
          </div>

          {isProcessing && (
            <div className="flex justify-center items-center gap-2 text-blue-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing audio...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Display */}
      {transcription && (
        <Card className="p-6 bg-gray-50">
          <h3 className="font-semibold text-lg mb-3">Transcription</h3>
          <p className="text-gray-700 leading-relaxed border-l-4 border-blue-400 pl-4">
            {transcription}
          </p>
        </Card>
      )}

      {/* Medications List */}
      {medications.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Medications</h3>
          <div className="space-y-4">
            {medications.map((med, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Medicine</p>
                    <p className="font-semibold text-gray-900">{med.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dosage</p>
                    <p className="font-semibold text-gray-900">{med.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frequency</p>
                    <p className="font-semibold text-gray-900">{med.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{med.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Additional Notes */}
      {additionalNotes && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-3">Additional Notes</h3>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Any additional instructions or notes..."
          />
        </Card>
      )}

      {/* Submit Button */}
      {medications.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={submitPrescription}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            size="lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Send to Pharmacy
          </Button>
          <Button
            onClick={() => {
              setTranscription('');
              setMedications([]);
              setAdditionalNotes('');
            }}
            variant="outline"
            size="lg"
          >
            Clear & Restart
          </Button>
        </div>
      )}
    </div>
  );
}
