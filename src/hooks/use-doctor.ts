import { useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDetail extends Patient {
  appointments: Appointment[];
  prescriptions: Prescription[];
  emrRecords: EMRRecord[];
  labTests: LabTest[];
  bedAssignments: BedAssignment[];
}

export interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
  }>;
  instructions: string;
  dispensed: boolean;
  dispensedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EMRRecord {
  id: string;
  diagnosis: string;
  symptoms: string;
  vitals?: Record<string, any>;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LabTest {
  id: string;
  testType: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  results?: Record<string, any>;
  priority?: string;
  createdAt: string;
}

export interface BedAssignment {
  id: string;
  bedId: string;
  assignedAt: string;
  dischargedAt?: string;
  createdAt: string;
}

export interface Surgery {
  id: string;
  patientName: string;
  surgeryType: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  anesthesiologist?: string;
  createdAt: string;
}

export interface VitalScore {
  name: string;
  value: string | number | null;
  score: number;
  status: 'normal' | 'warning' | 'critical' | 'unknown';
  normalRange?: string;
}

export interface HealthIndex {
  overallScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | 'UNKNOWN';
  trendDelta: number;
  category: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  breakdown: {
    vitals: VitalScore[];
    vitalsScore: number;
    labScore: number;
    medicationScore: number;
    hospitalizationScore: number;
    diagnosisScore: number;
  };
  lastUpdated: string;
  dataPoints: number;
  historicalScores: Array<{ date: string; score: number }>;
}

/**
 * Hook for doctor API interactions
 * Handles all patient, prescription, EMR, and lab data fetching
 */
export function useDoctor() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // PATIENT OPERATIONS
  // ============================================================================

  const getPatients = useCallback(async (): Promise<Patient[]> => {
    if (!session) {
      setError('Not authenticated');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/doctor/patients', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch patients');
      }

      const patients = await response.json();
      return patients;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  const getPatientDetail = useCallback(
    async (patientId: string): Promise<PatientDetail | null> => {
      if (!patientId) {
        setError('Invalid patient ID');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/patients/${patientId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch patient details');
        }

        const patient = await response.json();
        return patient;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // EMR OPERATIONS
  // ============================================================================

  const createEMR = useCallback(
    async (
      patientId: string,
      data: {
        diagnosis: string;
        symptoms: string;
        vitals?: Record<string, any>;
        notes?: string;
        attachments?: string[];
      }
    ): Promise<EMRRecord | null> => {
      if (!patientId) {
        setError('Invalid patient ID');
        return null;
      }

      // Validate required fields
      if (!data.diagnosis?.trim()) {
        setError('Diagnosis is required');
        return null;
      }

      if (!data.symptoms?.trim()) {
        setError('Symptoms are required');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/patients/${patientId}/emr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diagnosis: data.diagnosis.trim(),
            symptoms: data.symptoms.trim(),
            vitals: data.vitals,
            notes: data.notes?.trim(),
            attachments: data.attachments
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create EMR');
        }

        const emr = await response.json();
        toast({ title: 'Success', description: 'EMR record created successfully' });
        return emr;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateEMR = useCallback(
    async (
      patientId: string,
      emrId: string,
      data: {
        diagnosis?: string;
        symptoms?: string;
        vitals?: Record<string, any>;
        notes?: string;
      }
    ): Promise<EMRRecord | null> => {
      if (!patientId || !emrId) {
        setError('Invalid patient or EMR ID');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/patients/${patientId}/emr/${emrId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update EMR');
        }

        const emr = await response.json();
        toast({ title: 'Success', description: 'EMR record updated successfully' });
        return emr;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // PRESCRIPTION OPERATIONS
  // ============================================================================

  const getPrescriptions = useCallback(
    async (dispensed?: boolean): Promise<Prescription[]> => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/doctor/prescriptions', window.location.origin);
        if (dispensed !== undefined) {
          url.searchParams.set('dispensed', String(dispensed));
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch prescriptions');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const createPrescription = useCallback(
    async (data: {
      patientId: string;
      medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration?: string;
      }>;
      instructions: string;
    }): Promise<Prescription | null> => {
      // Validation
      if (!data.patientId?.trim()) {
        setError('Patient ID is required');
        return null;
      }

      if (!data.medications?.length) {
        setError('At least one medication is required');
        return null;
      }

      if (!data.instructions?.trim()) {
        setError('Instructions are required');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/doctor/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create prescription');
        }

        const rx = await response.json();
        toast({ title: 'Success', description: 'Prescription created successfully' });
        return rx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updatePrescription = useCallback(
    async (
      prescriptionId: string,
      data: {
        medications?: Array<{ name: string; dosage: string; frequency: string }>;
        instructions?: string;
      }
    ): Promise<Prescription | null> => {
      if (!prescriptionId) {
        setError('Invalid prescription ID');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update prescription');
        }

        const rx = await response.json();
        toast({ title: 'Success', description: 'Prescription updated successfully' });
        return rx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // APPOINTMENT OPERATIONS
  // ============================================================================

  const getAppointments = useCallback(
    async (filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<Appointment[]> => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/doctor/appointments', window.location.origin);
        if (filters?.status) url.searchParams.set('status', filters.status);
        if (filters?.dateFrom) url.searchParams.set('dateFrom', filters.dateFrom);
        if (filters?.dateTo) url.searchParams.set('dateTo', filters.dateTo);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch appointments');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateAppointment = useCallback(
    async (
      appointmentId: string,
      data: {
        status?: string;
        notes?: string;
      }
    ): Promise<Appointment | null> => {
      if (!appointmentId) {
        setError('Invalid appointment ID');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update appointment');
        }

        const apt = await response.json();
        toast({ title: 'Success', description: 'Appointment updated successfully' });
        return apt;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // LAB OPERATIONS
  // ============================================================================

  const getLabResults = useCallback(
    async (filters?: {
      status?: string;
      patientId?: string;
    }): Promise<LabTest[]> => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/doctor/lab-results', window.location.origin);
        if (filters?.status) url.searchParams.set('status', filters.status);
        if (filters?.patientId) url.searchParams.set('patientId', filters.patientId);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch lab results');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const orderLabTest = useCallback(
    async (data: {
      patientId: string;
      testType: string;
      instructions?: string;
      priority?: 'ROUTINE' | 'URGENT';
    }): Promise<LabTest | null> => {
      // Validation
      if (!data.patientId?.trim()) {
        setError('Patient ID is required');
        return null;
      }

      if (!data.testType?.trim()) {
        setError('Test type is required');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/doctor/lab-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to order lab test');
        }

        const test = await response.json();
        toast({ title: 'Success', description: 'Lab test ordered successfully' });
        return test;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // SURGERY OPERATIONS
  // ============================================================================

  const getSurgeries = useCallback(
    async (filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<Surgery[]> => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/doctor/surgeries', window.location.origin);
        if (filters?.status) url.searchParams.set('status', filters.status);
        if (filters?.dateFrom) url.searchParams.set('dateFrom', filters.dateFrom);
        if (filters?.dateTo) url.searchParams.set('dateTo', filters.dateTo);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch surgeries');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const scheduleSurgery = useCallback(
    async (data: {
      patientId: string;
      surgeryType: string;
      scheduledAt: string;
      notes?: string;
      anesthesiologist?: string;
    }): Promise<{ surgery: Surgery; warning?: string } | null> => {
      // Validation
      if (!data.patientId?.trim()) {
        setError('Patient ID is required');
        return null;
      }

      if (!data.surgeryType?.trim()) {
        setError('Surgery type is required');
        return null;
      }

      if (!data.scheduledAt) {
        setError('Surgery date is required');
        return null;
      }

      // Check if date is in future
      if (new Date(data.scheduledAt) < new Date()) {
        setError('Surgery date must be in the future');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/doctor/surgeries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to schedule surgery');
        }

        const result = await response.json();
        if (result.warning) {
          toast({ title: 'Warning', description: result.warning });
        } else {
          toast({ title: 'Success', description: 'Surgery scheduled successfully' });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = useCallback(() => setError(null), []);

  // ============================================================================
  // HEALTH INDEX
  // ============================================================================

  const getHealthIndex = useCallback(
    async (patientId: string): Promise<HealthIndex | null> => {
      if (!patientId) {
        setError('Invalid patient ID');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/doctor/patients/${patientId}/health-index`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch health index');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    loading,
    error,
    clearError,

    // Patient
    getPatients,
    getPatientDetail,

    // EMR
    createEMR,
    updateEMR,

    // Prescription
    getPrescriptions,
    createPrescription,
    updatePrescription,

    // Appointment
    getAppointments,
    updateAppointment,

    // Lab
    getLabResults,
    orderLabTest,

    // Surgery
    getSurgeries,
    scheduleSurgery,

    // Health Index
    getHealthIndex
  };
}
