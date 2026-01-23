'use client';

import React, { useState } from 'react';
import { useDoctor } from '@/hooks/use-doctor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface LabOrderFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COMMON_LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'Metabolic Panel',
  'Lipid Panel',
  'Blood Glucose',
  'Hemoglobin A1C',
  'TSH (Thyroid)',
  'Liver Function Tests',
  'Kidney Function Tests',
  'Urinalysis',
  'ECG',
  'X-Ray',
  'CT Scan',
  'Ultrasound',
  'MRI'
];

export function LabOrderFormComponent({ patientId, onSuccess, onCancel }: LabOrderFormProps) {
  const { orderLabTest, loading, error } = useDoctor();
  const [testType, setTestType] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');
  const [submitted, setSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);

    if (!testType.trim()) {
      return;
    }

    const result = await orderLabTest({
      patientId,
      testType: testType.trim(),
      instructions: instructions.trim() || undefined,
      priority
    });

    if (result) {
      setSubmitted(true);
      setTestType('');
      setInstructions('');
      setPriority('ROUTINE');

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
            <p className="font-medium">Lab Test Ordered Successfully</p>
            <p className="text-sm">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredTests = showSuggestions
    ? COMMON_LAB_TESTS.filter((test) =>
        test.toLowerCase().includes(testType.toLowerCase())
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Lab Test</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Test Type */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              Test Type *
            </label>
            <Input
              type="text"
              placeholder="Search or enter lab test name"
              value={testType}
              onChange={(e) => {
                setTestType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              required
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && testType && filteredTests.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                {filteredTests.map((test) => (
                  <button
                    key={test}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setTestType(test);
                      setShowSuggestions(false);
                    }}
                  >
                    {test}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Priority
            </label>
            <div className="flex gap-3">
              {(['ROUTINE', 'URGENT'] as const).map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={(e) => setPriority(e.target.value as 'ROUTINE' | 'URGENT')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {p}
                    {p === 'URGENT' && ' (Fast track)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Instructions
            </label>
            <Textarea
              placeholder="Fasting requirements, special preparation, timing, etc."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              E.g., 'NPO (nothing by mouth) after midnight', 'Collect morning sample'
            </p>
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm">
              <span className="font-medium">{testType || 'Lab test'}</span> will
              be marked as <span className="font-medium">{priority}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !testType.trim()}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" />
                  Ordering...
                </>
              ) : (
                'Order Lab Test'
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
