'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export type EmergencySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EmergencyStatus = 'ACTIVE' | 'TREATED' | 'DISCHARGED' | 'TRANSFERRED';

export interface EmergencyCase {
  id: string;
  patientName: string;
  condition: string;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  arrivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyOverride {
  token: string;
  expiresAt: string;
}

export interface CreateEmergencyInput {
  patientName: string;
  condition: string;
  severity: EmergencySeverity;
}

export interface RequestOverrideInput {
  reason: string;
  targetUserId?: string;
  ttlMinutes?: number;
}

export function useEmergency() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all emergency cases
  const getEmergencyCases = useCallback(async (): Promise<EmergencyCase[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/emergency', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch emergency cases');
      }
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch emergency cases';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new emergency case
  const createEmergencyCase = useCallback(
    async (input: CreateEmergencyInput): Promise<EmergencyCase | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/emergency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create emergency case');
        }
        const newCase = await res.json();
        toast({
          title: 'Emergency Case Created',
          description: `Patient ${input.patientName} has been registered.`,
        });
        return newCase;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create emergency case';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Request emergency override (break-glass access)
  const requestEmergencyOverride = useCallback(
    async (input: RequestOverrideInput): Promise<EmergencyOverride | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/override', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to request emergency override');
        }
        const override = await res.json();
        toast({
          title: 'Emergency Override Granted',
          description: `Access granted until ${new Date(override.expiresAt).toLocaleTimeString()}`,
        });
        return override;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to request emergency override';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
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
    session,
    getEmergencyCases,
    createEmergencyCase,
    requestEmergencyOverride,
  };
}
