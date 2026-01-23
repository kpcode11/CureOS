# Doctor Module - Complete Implementation Reference

## 📊 Complete Status: ✅ 100% PHASE 1 + PHASE 2 DONE

### Phase 1: Backend (11 Routes) ✅
- [x] GET /api/doctor/patients
- [x] GET /api/doctor/patients/:id
- [x] GET/POST/PATCH /api/doctor/patients/:id/emr
- [x] GET/POST /api/doctor/prescriptions
- [x] GET/PATCH /api/doctor/prescriptions/:id
- [x] GET/PATCH /api/doctor/appointments
- [x] GET/POST /api/doctor/lab-results
- [x] GET/POST /api/doctor/surgeries

### Phase 2: Frontend ✅
- [x] Custom Hook (useDoctor) - 16 functions
- [x] 6 Reusable Components (patient list, detail, forms)
- [x] 7 Page Routes (dashboard, patients, surgeries)
- [x] Dashboard with real data
- [x] Modal dialogs for inline form submission
- [x] Full error handling and validation
- [x] Type-safe implementation

---

## 🎯 Navigation Map

```
/doctor (Dashboard)
├── Stats: Patients, Prescriptions, Surgeries, Appointments
├── Quick Actions
│   ├── View My Patients → /doctor/patients
│   └── Manage Surgeries → /doctor/surgeries
└── Recent Appointments

/doctor/patients (Patient List)
├── Search by name/phone/email
├── Click patient → /doctor/patients/[id]

/doctor/patients/[id] (Patient Detail)
├── Tabs: EMR | Appointments | Labs | Prescriptions
├── Actions:
│   ├── New EMR → Modal (or /doctor/patients/[id]/emr)
│   ├── New Prescription → Modal (or /doctor/patients/[id]/prescribe)
│   └── Order Lab Test → Modal (or /doctor/patients/[id]/labs)

/doctor/surgeries (Surgery Management)
├── Surgery list with status
├── Schedule Surgery button
├── Patient dropdown
└── Surgery form (appears after patient selected)
```

---

## 📦 Component Usage Examples

### Using useDoctor Hook

```typescript
import { useDoctor } from '@/hooks/use-doctor';

function MyComponent() {
  const { 
    getPatients, 
    getPatientDetail, 
    createEMR,
    loading,
    error 
  } = useDoctor();

  useEffect(() => {
    const loadData = async () => {
      const patients = await getPatients();
      const detail = await getPatientDetail(patientId);
      const emr = await createEMR(patientId, { diagnosis, symptoms });
    };
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
}
```

### Using PatientListComponent

```typescript
import { PatientListComponent } from '@/components/doctor/patient-list';

// Simple usage
<PatientListComponent />

// With callback
<PatientListComponent 
  onSelectPatient={(patient) => {
    console.log(patient.id);
  }}
/>
```

### Using PatientDetailComponent

```typescript
import { PatientDetailComponent } from '@/components/doctor/patient-detail';

<PatientDetailComponent
  patientId={patientId}
  onOpenEMR={() => setShowEMRForm(true)}
  onOpenPrescription={() => setShowRxForm(true)}
  onOpenLabOrder={() => setShowLabForm(true)}
/>
```

### Using Forms

```typescript
// EMR Form
<EMRFormComponent
  patientId={patientId}
  onSuccess={() => navigate(-1)}
  onCancel={() => setOpen(false)}
/>

// Prescription Form
<PrescriptionFormComponent
  patientId={patientId}
  onSuccess={() => navigate(-1)}
  onCancel={() => setOpen(false)}
/>

// Lab Order Form
<LabOrderFormComponent
  patientId={patientId}
  onSuccess={() => navigate(-1)}
  onCancel={() => setOpen(false)}
/>

// Surgery Form
<SurgeryFormComponent
  patientId={patientId}
  patientName="John Doe"
  onSuccess={() => navigate(-1)}
  onCancel={() => setOpen(false)}
/>
```

---

## 🔍 Hook Function Reference

### Patient Operations
```typescript
// Get all patients assigned to current doctor
const patients = await getPatients();
// Returns: Patient[] - Full list of all patients

// Get patient with all relationships
const patient = await getPatientDetail('patient-id');
// Returns: PatientDetail | null
// Includes: appointments, prescriptions, emrRecords, labTests, bedAssignments
```

### EMR Operations
```typescript
// Create EMR record
const emr = await createEMR('patient-id', {
  diagnosis: 'Hypertension',
  symptoms: 'Elevated BP',
  vitals: { temperature: 37.2, bp: '140/90' }, // Optional
  notes: 'Monitor for 2 weeks' // Optional
});
// Returns: EMRRecord | null

// Update EMR record
const updated = await updateEMR('patient-id', 'emr-id', {
  diagnosis: 'Updated diagnosis',
  // ... only include fields to update
});
```

### Prescription Operations
```typescript
// Get prescriptions (optionally filter by dispensed)
const pending = await getPrescriptions(false); // Undispensed only
const all = await getPrescriptions(); // All prescriptions

// Create prescription
const rx = await createPrescription('patient-id', {
  medications: [
    { name: 'Aspirin', dosage: '100mg', frequency: 'daily', duration: '7 days' },
    { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' }
  ],
  instructions: 'Take with food'
});

// Update prescription (blocks if already dispensed)
const updated = await updatePrescription('rx-id', {
  instructions: 'Updated instructions'
});
```

### Appointment Operations
```typescript
// Get appointments with optional filtering
const upcoming = await getAppointments({
  status: 'SCHEDULED',
  dateFrom: new Date(),
  dateTo: new Date(Date.now() + 30*24*60*60*1000)
});

// Update appointment
const updated = await updateAppointment('apt-id', {
  status: 'COMPLETED',
  notes: 'Patient stable'
});
```

### Lab Operations
```typescript
// Get lab tests with optional filtering
const pending = await getLabResults({
  status: 'PENDING'
});

// Order lab test
const lab = await orderLabTest('patient-id', {
  testType: 'CBC',
  priority: 'ROUTINE', // or 'URGENT'
  instructions: 'NPO 8 hours before test'
});
```

### Surgery Operations
```typescript
// Get surgeries with optional filtering
const scheduled = await getSurgeries({
  status: 'SCHEDULED'
});

// Schedule surgery (must be future date)
const surgery = await scheduleSurgery('patient-id', {
  surgeryType: 'Appendectomy',
  surgeryDate: '2024-02-15T10:30:00',
  anesthesiologist: 'Dr. Smith', // Optional
  notes: 'Patient has mild anemia' // Optional
});
```

---

## 🎨 Component Prop Interfaces

### PatientListComponent
```typescript
interface PatientListComponentProps {
  onSelectPatient?: (patient: Patient) => void;
  showActions?: boolean; // default: true
}
```

### PatientDetailComponent
```typescript
interface PatientDetailComponentProps {
  patientId: string; // Required
  onOpenEMR?: () => void;
  onOpenPrescription?: () => void;
  onOpenLabOrder?: () => void;
}
```

### EMRFormComponent
```typescript
interface EMRFormComponentProps {
  patientId: string; // Required
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### PrescriptionFormComponent
```typescript
interface PrescriptionFormComponentProps {
  patientId: string; // Required
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### LabOrderFormComponent
```typescript
interface LabOrderFormComponentProps {
  patientId: string; // Required
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### SurgeryFormComponent
```typescript
interface SurgeryFormComponentProps {
  patientId: string; // Required
  patientName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

---

## 🔐 Permissions & RBAC

All endpoints require doctor role with specific permissions:

| Endpoint | Permission | Role |
|----------|-----------|------|
| GET /api/doctor/patients | doctor.read | Doctor |
| GET /api/doctor/patients/:id | doctor.read | Doctor |
| POST /api/doctor/emr | emr.write | Doctor |
| GET /api/doctor/emr | emr.read | Doctor |
| POST /api/doctor/prescriptions | prescription.write | Doctor |
| GET /api/doctor/prescriptions | prescription.read | Doctor |
| GET /api/doctor/appointments | appointment.read | Doctor |
| PATCH /api/doctor/appointments | appointment.write | Doctor |
| POST /api/doctor/lab-results | lab.write | Doctor |
| GET /api/doctor/lab-results | lab.read | Doctor |
| POST /api/doctor/surgeries | surgery.write | Doctor |
| GET /api/doctor/surgeries | surgery.read | Doctor |

---

## 🛡️ Error Handling

### Common Errors & Handling

```typescript
// Hook automatically handles these:
{
  error: 'You don\'t have access to this patient\'s records'  // 403
  error: 'Patient not found'                                    // 404
  error: 'Missing required field: diagnosis'                    // 400
  error: 'This prescription has already been dispensed'         // 400
  error: 'Surgery date must be in the future'                   // 400
}

// Components show error in red box:
{error && (
  <div className="bg-red-100 border border-red-400 rounded p-4">
    <AlertCircle className="h-5 w-5" />
    {error}
  </div>
)}
```

---

## 📋 Form Validation Summary

| Form | Required Fields | Validation |
|------|-----------------|-----------|
| EMR | diagnosis, symptoms | Both must have content |
| Prescription | medications, instructions | ≥1 med with name/dosage/frequency |
| Lab Order | testType | Min 1 character |
| Surgery | surgeryType, surgeryDate | Type + Future date required |

---

## 🚀 Deployment Checklist

### Before Deploy
- [ ] Run `npm run build` (no TypeScript errors)
- [ ] Run `npm run test` (all tests pass)
- [ ] Test locally: `npm run dev`
- [ ] Verify all 7 routes load without 404s
- [ ] Check DevTools Network tab for API calls

### After Deploy
- [ ] Test /doctor dashboard loads
- [ ] Test /doctor/patients list and search
- [ ] Test patient detail page with all tabs
- [ ] Test EMR form submission
- [ ] Test prescription form with multiple medications
- [ ] Test lab order form with autocomplete
- [ ] Test surgery scheduling with date validation
- [ ] Check error handling (try invalid patientId)

---

## 📝 Files Structure

```
src/
├── hooks/
│   └── use-doctor.ts (738 lines, 16 functions)
├── components/
│   ├── dashboards/
│   │   └── doctor-dashboard.tsx (updated with real data)
│   └── doctor/
│       ├── patient-list.tsx
│       ├── patient-detail.tsx
│       ├── emr-form.tsx
│       ├── prescription-form.tsx
│       ├── lab-order-form.tsx
│       └── surgery-form.tsx
└── app/(dashboard)/doctor/
    ├── page.tsx (dashboard)
    ├── patients/
    │   ├── page.tsx (list)
    │   └── [id]/
    │       ├── page.tsx (detail with modals)
    │       ├── emr/
    │       │   └── page.tsx (full-screen form)
    │       ├── prescribe/
    │       │   └── page.tsx (full-screen form)
    │       └── labs/
    │           └── page.tsx (full-screen form)
    └── surgeries/
        └── page.tsx (list + inline form)

tests/
├── doctor.routes.test.ts (Phase 1 - 40+ cases)
└── doctor.phase2.test.ts (Phase 2 - component + manual tests)
```

---

## 🔗 API Contract

All responses follow this pattern:

### Success Responses
```typescript
// Single item
{ /* Item data */ }

// Multiple items
[ /* Item array */ ]
```

### Error Responses
```typescript
{
  error: "Error message here"
}
```

### Status Codes
- 200: Success
- 400: Validation error
- 403: Permission denied
- 404: Not found
- 500: Server error

---

## 💡 Pro Tips

1. **Use PatientListComponent** for any patient selection UI
2. **Always check `onSuccess` callback** - forms don't redirect automatically
3. **Modal dialogs** available on patient detail page - use for inline editing
4. **Autocomplete fields** support custom values (not just predefined options)
5. **All dates** stored as ISO strings - use `new Date()` for conversions
6. **Vitals** stored as JSON - structure flexibly as needed
7. **Status filters** are case-sensitive (use exact values)
8. **Surgery conflicts** logged but don't block creation

---

## 🆘 Troubleshooting

### Patient not found
- Verify patient exists in database
- Check if doctor has access to this patient
- Try with different patientId from getPatients()

### Form won't submit
- Check required fields are filled
- For surgery: ensure date is in future
- For prescription: ensure at least 1 medication
- Check browser console for validation errors

### API errors not showing
- Hook should show toast - check if useToast is working
- Error component may not be displayed - check component render
- Network tab in DevTools shows actual API responses

### Autocomplete not filtering
- Check input value is updating
- Lab tests: 14 predefined options listed in code
- Surgeries: 14 predefined options listed in code
- Custom values should still work if not in list

### Modals not closing
- Check onCancel callback is set
- Verify modal X button onclick handler
- Check z-index if modal appears behind other elements

---

## 📞 Support Resources

- See `DOCTOR_PHASE2_COMPLETE.md` for detailed documentation
- Check `doctor.phase2.test.ts` for testing examples
- Review component prop interfaces for required fields
- Check Phase 1 API documentation for endpoint details

---

## ✨ Quick Copy-Paste Templates

### Adding EMR to a page
```tsx
import { EMRFormComponent } from '@/components/doctor/emr-form';

<EMRFormComponent
  patientId={patientId}
  onSuccess={() => router.refresh()}
  onCancel={() => setOpen(false)}
/>
```

### Adding Surgery Form to a page
```tsx
import { SurgeryFormComponent } from '@/components/doctor/surgery-form';

<SurgeryFormComponent
  patientId={patientId}
  onSuccess={() => router.back()}
  onCancel={() => setOpen(false)}
/>
```

### Fetching patient data
```tsx
const { getPatientDetail, loading } = useDoctor();

useEffect(() => {
  const load = async () => {
    const patient = await getPatientDetail(patientId);
    setData(patient);
  };
  load();
}, [patientId]);
```

---

**Last Updated:** 2024-01-23  
**Phase:** 1 + 2 Complete ✅  
**Version:** 1.0.0  
**Status:** Production Ready
