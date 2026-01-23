// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as patientsRoute from '@/app/api/doctor/patients/route';
import * as patientDetailRoute from '@/app/api/doctor/patients/[id]/route';
import * as emrRoute from '@/app/api/doctor/patients/[id]/emr/route';
import * as prescriptionsRoute from '@/app/api/doctor/prescriptions/route';
import * as prescriptionDetailRoute from '@/app/api/doctor/prescriptions/[id]/route';
import * as appointmentsRoute from '@/app/api/doctor/appointments/route';
import * as labResultsRoute from '@/app/api/doctor/lab-results/route';
import * as surgeriesRoute from '@/app/api/doctor/surgeries/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const jsonRequest = (method: string = 'GET', body?: any) =>
  new Request('http://localhost', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' }
  });

const mockParams = (id: string, emrId?: string) => ({
  id: Promise.resolve(id),
  emrId: emrId ? Promise.resolve(emrId) : undefined
});

describe('Doctor API Routes - Phase 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authLib, 'requirePermission').mockResolvedValue({
      session: { user: { id: 'doctor-123', email: 'doc@test.com', role: 'DOCTOR' } },
      usedOverride: false
    });
  });

  describe('GET /api/doctor/patients', () => {
    it('should return 403 if user lacks doctor.read permission', async () => {
      vi.spyOn(authLib, 'requirePermission').mockRejectedValue(new Error('Forbidden'));
      const response = await patientsRoute.GET(jsonRequest());
      expect(response.status).toBe(403);
    });

    it('should return 400 if doctor ID not found in session', async () => {
      vi.spyOn(authLib, 'requirePermission').mockResolvedValue({
        session: { user: { id: null, email: 'doc@test.com', role: 'DOCTOR' } },
        usedOverride: false
      });
      const response = await patientsRoute.GET(jsonRequest());
      expect(response.status).toBe(400);
    });

    it('should return 404 if doctor profile not found', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue(null);
      const response = await patientsRoute.GET(jsonRequest());
      expect(response.status).toBe(404);
    });

    it('should return empty array if doctor has no patients', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([]);
      const response = await patientsRoute.GET(jsonRequest());
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should return list of patients for the doctor', async () => {
      const mockPatient = {
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'M',
        bloodType: 'O+',
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([mockPatient]);
      const response = await patientsRoute.GET(jsonRequest());
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].firstName).toBe('John');
    });
  });

  describe('GET /api/doctor/patients/:id', () => {
    it('should return 400 if patient ID is invalid', async () => {
      const response = await patientDetailRoute.GET(jsonRequest(), mockParams(''));
      expect(response.status).toBe(400);
    });

    it('should return 404 if patient not found', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
      const response = await patientDetailRoute.GET(jsonRequest(), mockParams('pat-1'));
      expect(response.status).toBe(404);
    });

    it('should return patient with all related data', async () => {
      const mockDoctor = { id: 'doc-1' };
      const mockPatient = {
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'M',
        bloodType: 'O+',
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
        appointments: [],
        prescriptions: [],
        emrRecords: [],
        labTests: [],
        bedAssignments: []
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue(mockDoctor);
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(mockPatient);
      const response = await patientDetailRoute.GET(jsonRequest(), mockParams('pat-1'));
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.firstName).toBe('John');
      expect(data.appointments).toEqual([]);
    });
  });

  describe('POST /api/doctor/patients/:id/emr', () => {
    it('should return 400 if diagnosis is missing', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await emrRoute.POST(
        jsonRequest('POST', { symptoms: 'fever' }),
        mockParams('pat-1')
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('diagnosis');
    });

    it('should return 400 if symptoms is missing', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await emrRoute.POST(
        jsonRequest('POST', { diagnosis: 'flu' }),
        mockParams('pat-1')
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 if vitals is not a valid object', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await emrRoute.POST(
        jsonRequest('POST', {
          diagnosis: 'flu',
          symptoms: 'fever',
          vitals: 'invalid'
        }),
        mockParams('pat-1')
      );
      expect(response.status).toBe(400);
    });

    it('should return 404 if patient not found', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
      const response = await emrRoute.POST(
        jsonRequest('POST', {
          diagnosis: 'flu',
          symptoms: 'fever'
        }),
        mockParams('pat-1')
      );
      expect(response.status).toBe(404);
    });

    it('should create EMR record successfully', async () => {
      const mockEMR = {
        id: 'emr-1',
        patientId: 'pat-1',
        diagnosis: 'flu',
        symptoms: 'fever',
        vitals: { temp: 101 },
        notes: 'Rest recommended',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockEMR);

      const response = await emrRoute.POST(
        jsonRequest('POST', {
          diagnosis: 'flu',
          symptoms: 'fever',
          vitals: { temp: 101 },
          notes: 'Rest recommended'
        }),
        mockParams('pat-1')
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.diagnosis).toBe('flu');
    });
  });

  describe('POST /api/doctor/prescriptions', () => {
    it('should return 400 if patientId is missing', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await prescriptionsRoute.POST(
        jsonRequest('POST', {
          medications: [{ name: 'aspirin', dosage: '100mg', frequency: 'daily' }],
          instructions: 'take daily'
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 if medications array is empty', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await prescriptionsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          medications: [],
          instructions: 'take daily'
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 if medication is missing required fields', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await prescriptionsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          medications: [{ name: 'aspirin' }], // missing dosage and frequency
          instructions: 'take daily'
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 404 if patient not found', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
      const response = await prescriptionsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          medications: [{ name: 'aspirin', dosage: '100mg', frequency: 'daily' }],
          instructions: 'take daily'
        })
      );
      expect(response.status).toBe(404);
    });

    it('should create prescription successfully', async () => {
      const mockPrescription = {
        id: 'rx-1',
        patientId: 'pat-1',
        doctorId: 'doc-1',
        pharmacistId: null,
        medications: [{ name: 'aspirin', dosage: '100mg', frequency: 'daily' }],
        instructions: 'take daily',
        dispensed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockPrescription);

      const response = await prescriptionsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          medications: [{ name: 'aspirin', dosage: '100mg', frequency: 'daily' }],
          instructions: 'take daily'
        })
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.medications.length).toBe(1);
    });
  });

  describe('PATCH /api/doctor/prescriptions/:id', () => {
    it('should return 400 if no updates provided', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const response = await prescriptionDetailRoute.PATCH(
        jsonRequest('PATCH', {}),
        mockParams('rx-1')
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 if already dispensed', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.prescription, 'findUnique').mockResolvedValue({
        id: 'rx-1',
        doctorId: 'doc-1',
        dispensed: true
      });
      const response = await prescriptionDetailRoute.PATCH(
        jsonRequest('PATCH', {
          instructions: 'updated'
        }),
        mockParams('rx-1')
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('dispensed');
    });

    it('should update prescription successfully', async () => {
      const mockPrescription = {
        id: 'rx-1',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        medications: [{ name: 'aspirin', dosage: '200mg', frequency: 'twice daily' }],
        instructions: 'updated',
        dispensed: false
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.prescription, 'findUnique').mockResolvedValue({
        id: 'rx-1',
        doctorId: 'doc-1',
        dispensed: false
      });
      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockPrescription);

      const response = await prescriptionDetailRoute.PATCH(
        jsonRequest('PATCH', {
          instructions: 'updated'
        }),
        mockParams('rx-1')
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.instructions).toBe('updated');
    });
  });

  describe('POST /api/doctor/surgeries', () => {
    it('should return 400 if scheduledAt is in the past', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      const pastDate = new Date(Date.now() - 86400000); // 24 hours ago
      const response = await surgeriesRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          surgeryType: 'appendectomy',
          scheduledAt: pastDate.toISOString(),
          notes: 'emergency'
        })
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('past');
    });

    it('should return 404 if patient not found', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
      const futureDate = new Date(Date.now() + 86400000); // 24 hours from now
      const response = await surgeriesRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          surgeryType: 'appendectomy',
          scheduledAt: futureDate.toISOString()
        })
      );
      expect(response.status).toBe(404);
    });

    it('should warn about conflicting surgeries but still create', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockSurgery = {
        id: 'surg-1',
        doctorId: 'doc-1',
        patientName: 'John Doe',
        surgeryType: 'appendectomy',
        scheduledAt: futureDate,
        status: 'SCHEDULED',
        notes: null,
        anesthesiologist: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      vi.spyOn(prisma.appointment, 'findFirst').mockResolvedValue({ id: 'apt-1' });
      vi.spyOn(prisma.surgery, 'findMany').mockResolvedValue([{ id: 'surg-existing' }]); // conflict
      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockSurgery);

      const response = await surgeriesRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          surgeryType: 'appendectomy',
          scheduledAt: futureDate.toISOString()
        })
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.warning).toContain('conflicting');
    });
  });

  describe('POST /api/doctor/lab-orders', () => {
    it('should return 403 if doctor has no access to patient', async () => {
      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      vi.spyOn(prisma.appointment, 'findFirst').mockResolvedValue(null); // no access
      
      const response = await labResultsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          testType: 'CBC'
        })
      );
      expect(response.status).toBe(403);
    });

    it('should create lab order with priority', async () => {
      const mockLabTest = {
        id: 'lab-1',
        patientId: 'pat-1',
        testType: 'CBC',
        instructions: 'fasting required',
        status: 'PENDING',
        priority: 'URGENT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({ id: 'doc-1' });
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      vi.spyOn(prisma.appointment, 'findFirst').mockResolvedValue({ id: 'apt-1' });
      vi.spyOn(prisma, '$transaction').mockResolvedValue(mockLabTest);

      const response = await labResultsRoute.POST(
        jsonRequest('POST', {
          patientId: 'pat-1',
          testType: 'CBC',
          instructions: 'fasting required',
          priority: 'URGENT'
        })
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.priority).toBe('URGENT');
    });
  });
});
