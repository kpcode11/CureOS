'use client';

import React, { useState } from 'react';
import { useDoctor } from '@/hooks/use-doctor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface SurgeryFormProps {
  patientId: string;
  patientName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COMMON_SURGERIES = [
  'Appendectomy',
  'Cholecystectomy',
  'Hernia Repair',
  'Caesarean Section',
  'Hysterectomy',
  'Cataract Surgery',
  'Knee Replacement',
  'Hip Replacement',
  'Coronary Artery Bypass',
  'Gall Bladder Surgery',
  'Bypass Surgery',
  'Spinal Fusion',
  'Mastectomy',
  'Prostate Surgery'
];

export function SurgeryFormComponent({
  patientId,
  patientName,
  onSuccess,
  onCancel
}: SurgeryFormProps) {
  const { scheduleSurgery, loading, error } = useDoctor();
  const [surgeryType, setSurgeryType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [anesthesiologist, setAnesthesiologist] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const validateDateTime = (): boolean => {
    if (!scheduledAt) return false;
    const selected = new Date(scheduledAt);
    return selected > new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);
    setWarning(null);

    if (!validateDateTime()) {
      setWarning('Please select a future date and time');
      return;
    }

    const result = await scheduleSurgery({
      patientId,
      surgeryType: surgeryType.trim(),
      scheduledAt,
      notes: notes.trim() || undefined,
      anesthesiologist: anesthesiologist.trim() || undefined
    });

    if (result) {
      if (result.warning) {
        setWarning(result.warning);
      }

      setSubmitted(true);
      setSurgeryType('');
      setScheduledAt('');
      setNotes('');
      setAnesthesiologist('');

      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200">
        <CardContent className="flex items-center justify-center p-8 text-green-600">
          <CheckCircle className="mr-2 h-6 w-6" />
          <div>
            <p className="font-medium">Surgery Scheduled Successfully</p>
            <p className="text-sm">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredSurgeries = showSuggestions
    ? COMMON_SURGERIES.filter((s) =>
        s.toLowerCase().includes(surgeryType.toLowerCase())
      )
    : [];

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Surgery</CardTitle>
        {patientName && (
          <p className="text-sm text-gray-600 mt-2">Patient: {patientName}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {warning && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded flex gap-2">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700">{warning}</p>
            </div>
          )}

          {/* Surgery Type */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              Surgery Type *
            </label>
            <Input
              type="text"
              placeholder="Search or enter surgery type"
              value={surgeryType}
              onChange={(e) => {
                setSurgeryType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              required
            />

            {/* Suggestions */}
            {showSuggestions && surgeryType && filteredSurgeries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                {filteredSurgeries.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setSurgeryType(s);
                      setShowSuggestions(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Scheduled Date & Time *
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDateTime}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be in the future
            </p>
          </div>

          {/* Anesthesiologist */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Anesthesiologist
            </label>
            <Input
              type="text"
              placeholder="Name of anesthesiologist (optional)"
              value={anesthesiologist}
              onChange={(e) => setAnesthesiologist(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pre-Surgery Notes
            </label>
            <Textarea
              placeholder="Pre-operative instructions, special precautions, medical history notes, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Summary */}
          {surgeryType && scheduledAt && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{surgeryType}</span>
              </p>
              <p className="text-sm">
                Scheduled for:{' '}
                <span className="font-medium">
                  {new Date(scheduledAt).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !surgeryType.trim() || !scheduledAt}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" />
                  Scheduling...
                </>
              ) : (
                'Schedule Surgery'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
