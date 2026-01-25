'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Send, Loader, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface ProcessedPrescription {
  transcription: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  additionalNotes: string;
}

export default function VoicePrescribePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<'select-patient' | 'record' | 'review'>('select-patient');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [prescription, setPrescription] = useState<ProcessedPrescription | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await fetch('/api/doctor/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      }
    };
    loadPatients();
  }, []);

  // Recording timer
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
      alert('Microphone access denied. Please check your permissions.');
    }
  };

  const stopRecording = () => {
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
    if (!selectedPatient) {
      alert('No patient selected');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'prescription-audio.wav');
    formData.append('patientId', selectedPatient.id);

    try {
      const response = await fetch('/api/doctor/prescriptions/voice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPrescription({
          transcription: data.transcription,
          medications: data.parsed.medications,
          additionalNotes: data.parsed.additionalNotes,
        });
        setStep('review');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to process audio. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPrescription = async () => {
    if (!prescription || !selectedPatient) {
      alert('Prescription data missing');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          medications: prescription.medications,
          instructions: prescription.additionalNotes,
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

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-8 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link href="/doctor/prescriptions">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Voice Prescription</h1>
          <p className="text-gray-600">Create prescriptions using voice recognition</p>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === 'select-patient' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Patient</h2>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setStep('record');
                    }}
                    className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    <p className="font-semibold text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No patients found</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Record Voice */}
      {step === 'record' && selectedPatient && (
        <div className="space-y-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Patient:</strong> {selectedPatient.name} ({selectedPatient.email})
            </p>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Voice Input</h2>
                <p className="text-gray-600 text-sm">
                  Speak the medications, dosages, frequency, and instructions. Example: "Amoxicillin 500mg, twice daily for 7 days"
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-2xl font-mono font-semibold text-red-600">
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

          <Button
            onClick={() => {
              setStep('select-patient');
              setSelectedPatient(null);
              setSearchQuery('');
            }}
            variant="outline"
            className="w-full"
          >
            Change Patient
          </Button>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 'review' && selectedPatient && prescription && (
        <div className="space-y-6">
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-900">
              <strong>Patient:</strong> {selectedPatient.name} ({selectedPatient.email})
            </p>
          </Card>

          {/* Transcription */}
          <Card className="p-6 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Transcription</h3>
            <p className="text-gray-700 leading-relaxed border-l-4 border-blue-400 pl-4 py-2">
              {prescription.transcription}
            </p>
          </Card>

          {/* Medications */}
          {prescription.medications.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Medications Detected</h3>
              <div className="space-y-3">
                {prescription.medications.map((med, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase">Medicine</p>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase">Dosage</p>
                        <p className="font-semibold text-gray-900">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase">Frequency</p>
                        <p className="font-semibold text-gray-900">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase">Duration</p>
                        <p className="font-semibold text-gray-900">{med.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Additional Notes */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3">Additional Notes</h3>
            <textarea
              value={prescription.additionalNotes}
              onChange={(e) => {
                setPrescription({
                  ...prescription,
                  additionalNotes: e.target.value,
                });
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Any additional instructions or notes..."
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={submitPrescription}
              disabled={isProcessing || prescription.medications.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Send to Pharmacy
            </Button>
            <Button
              onClick={() => {
                setStep('record');
                setPrescription(null);
              }}
              variant="outline"
              size="lg"
            >
              Record Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
