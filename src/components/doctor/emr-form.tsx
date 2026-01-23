'use client';

import React, { useState } from 'react';
import { useDoctor } from '@/hooks/use-doctor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface EMRFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EMRFormComponent({ patientId, onSuccess, onCancel }: EMRFormProps) {
  const { createEMR, loading, error } = useDoctor();
  const [formData, setFormData] = useState({
    diagnosis: '',
    symptoms: '',
    notes: '',
    vitals: {} as Record<string, string>
  });
  const [vitalInputs, setVitalInputs] = useState<Array<{ key: string; value: string }>>([
    { key: 'temperature', value: '' },
    { key: 'blood_pressure', value: '' }
  ]);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleVitalChange = (index: number, field: 'key' | 'value', value: string) => {
    const newVitals = [...vitalInputs];
    newVitals[index] = { ...newVitals[index], [field]: value };
    setVitalInputs(newVitals);
  };

  const addVitalInput = () => {
    setVitalInputs([...vitalInputs, { key: '', value: '' }]);
  };

  const removeVitalInput = (index: number) => {
    setVitalInputs(vitalInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);

    // Build vitals object
    const vitals: Record<string, string> = {};
    vitalInputs.forEach((vital) => {
      if (vital.key && vital.value) {
        vitals[vital.key] = vital.value;
      }
    });

    const result = await createEMR(patientId, {
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms,
      notes: formData.notes || undefined,
      vitals: Object.keys(vitals).length > 0 ? vitals : undefined
    });

    if (result) {
      setSubmitted(true);
      setFormData({ diagnosis: '', symptoms: '', notes: '', vitals: {} });
      setVitalInputs([{ key: 'temperature', value: '' }, { key: 'blood_pressure', value: '' }]);
      
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
            <p className="font-medium">EMR Record Created Successfully</p>
            <p className="text-sm">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create EMR Record</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Diagnosis *
            </label>
            <Input
              type="text"
              placeholder="Primary diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleInputChange(e, 'diagnosis')}
              required
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Symptoms *
            </label>
            <Textarea
              placeholder="Patient symptoms and complaints"
              value={formData.symptoms}
              onChange={(e) => handleInputChange(e, 'symptoms')}
              rows={4}
              required
            />
          </div>

          {/* Vitals */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Vitals</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={addVitalInput}
              >
                + Add
              </Button>
            </div>
            <div className="space-y-2">
              {vitalInputs.map((vital, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="e.g., Temperature, BP, HR"
                    value={vital.key}
                    onChange={(e) => handleVitalChange(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="e.g., 98.6°F, 120/80, 72 bpm"
                    value={vital.value}
                    onChange={(e) => handleVitalChange(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  {vitalInputs.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVitalInput(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Notes
            </label>
            <Textarea
              placeholder="Treatment plan, recommendations, follow-up notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange(e, 'notes')}
              rows={4}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.diagnosis || !formData.symptoms}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save EMR Record'
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
