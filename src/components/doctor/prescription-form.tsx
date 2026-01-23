'use client';

import React, { useState } from 'react';
import { useDoctor } from '@/hooks/use-doctor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle, X } from 'lucide-react';

interface PrescriptionFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

export function PrescriptionFormComponent({ patientId, onSuccess, onCancel }: PrescriptionFormProps) {
  const { createPrescription, loading, error } = useDoctor();
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '' }
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const validateMedications = (): boolean => {
    return medications.every((med) => med.name && med.dosage && med.frequency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);

    if (!validateMedications()) {
      return;
    }

    if (!instructions.trim()) {
      return;
    }

    // Filter out empty medication fields
    const validMeds = medications.filter((m) => m.name && m.dosage && m.frequency);

    const result = await createPrescription({
      patientId,
      medications: validMeds,
      instructions
    });

    if (result) {
      setSubmitted(true);
      setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setInstructions('');

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200">
        <CardContent className="flex items-center justify-center p-8 text-green-600">
          <CheckCircle className="mr-2 h-6 w-6" />
          <div>
            <p className="font-medium">Prescription Created Successfully</p>
            <p className="text-sm">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isFormValid = validateMedications() && instructions.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Prescription</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Medications */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">Medications *</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMedication}
              >
                + Add Medication
              </Button>
            </div>

            <div className="space-y-3">
              {medications.map((med, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg space-y-2 bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-600">
                      Medication {index + 1}
                    </p>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Drug name *"
                      value={med.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Dosage *"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Frequency * (e.g., daily, twice daily)"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Duration (e.g., 7 days, 1 month)"
                      value={med.duration || ''}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Instructions *
            </label>
            <Textarea
              placeholder="Special instructions for patient (e.g., take with food, avoid dairy, follow-up in 2 weeks)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Include timing, meals, contraindications, and follow-up information
            </p>
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm">
              <span className="font-medium">{medications.length}</span> medication(s)
              will be prescribed
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create Prescription'
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
