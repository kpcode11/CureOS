# Doctor API - Complete Reference

## Base URL
```
http://localhost:3000/api/doctor
```

---

## Endpoints Summary

### Patients
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/patients` | doctor.read | List all patients |
| GET | `/patients/:id` | doctor.read | Get patient details |
| GET | `/patients/:id/emr` | emr.read | Get EMR records |
| POST | `/patients/:id/emr` | emr.write | Create EMR |
| PATCH | `/patients/:id/emr/:emrId` | emr.write | Update EMR |

### Prescriptions
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/prescriptions` | doctor.read | List prescriptions |
| POST | `/prescriptions` | prescription.create | Create prescription |
| GET | `/prescriptions/:id` | doctor.read | Get prescription |
| PATCH | `/prescriptions/:id` | prescription.update | Update prescription |

### Appointments
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/appointments` | appointment.read | List appointments |
| PATCH | `/appointments/:id` | appointment.update | Update appointment |

### Lab & Surgery
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/lab-results` | lab.read | Get lab results |
| POST | `/lab-results` | lab.order | Order lab tests |
| GET | `/surgeries` | surgery.read | List surgeries |
| POST | `/surgeries` | surgery.create | Schedule surgery |

---

## Detailed Endpoint Documentation

### GET /patients
**Get all patients assigned to doctor**

**Response:**
```json
[
  {
    "id": "pat-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-0100",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "gender": "M",
    "bloodType": "O+",
    "address": "123 Main St",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-24T15:30:00Z"
  }
]
```

**Error Responses:**
- 403: User lacks doctor.read permission
- 400: Doctor ID not found in session
- 404: Doctor profile not found
- 500: Database error

---

### GET /patients/:id
**Get detailed patient information**

**Path Parameters:**
- `id` (string, required): Patient ID

**Response:**
```json
{
  "id": "pat-123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "dateOfBirth": "1990-01-15T00:00:00Z",
  "gender": "M",
  "bloodType": "O+",
  "address": "123 Main St",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-24T15:30:00Z",
  "appointments": [
    {
      "id": "apt-456",
      "dateTime": "2026-02-01T14:00:00Z",
      "reason": "Checkup",
      "status": "SCHEDULED",
      "notes": "Patient reports chest pain",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ],
  "prescriptions": [
    {
      "id": "rx-789",
      "medications": [
        {
          "name": "Aspirin",
          "dosage": "100mg",
          "frequency": "daily",
          "duration": "7 days"
        }
      ],
      "instructions": "Take with food",
      "dispensed": false,
      "dispensedAt": null,
      "createdAt": "2026-01-22T09:00:00Z"
    }
  ],
  "emrRecords": [
    {
      "id": "emr-101",
      "diagnosis": "Hypertension",
      "symptoms": "High blood pressure",
      "vitals": {
        "bp": "150/90",
        "temp": "98.6",
        "pulse": "72"
      },
      "notes": "Start medication",
      "createdAt": "2026-01-20T10:00:00Z"
    }
  ],
  "labTests": [
    {
      "id": "lab-202",
      "testType": "CBC",
      "status": "PENDING",
      "results": null,
      "createdAt": "2026-01-24T11:00:00Z"
    }
  ],
  "bedAssignments": []
}
```

---

### POST /patients/:id/emr
**Create EMR record for patient**

**Path Parameters:**
- `id` (string, required): Patient ID

**Request Body:**
```json
{
  "diagnosis": "Type 2 Diabetes",
  "symptoms": "Increased thirst, frequent urination",
  "vitals": {
    "bloodSugar": "280 mg/dL",
    "bp": "130/85"
  },
  "notes": "Start metformin 500mg daily",
  "attachments": ["scan-001.pdf", "lab-report-001.pdf"]
}
```

**Response:** `201 Created`
```json
{
  "id": "emr-303",
  "patientId": "pat-123",
  "diagnosis": "Type 2 Diabetes",
  "symptoms": "Increased thirst, frequent urination",
  "vitals": {
    "bloodSugar": "280 mg/dL",
    "bp": "130/85"
  },
  "notes": "Start metformin 500mg daily",
  "attachments": ["scan-001.pdf", "lab-report-001.pdf"],
  "createdAt": "2026-01-24T16:45:00Z",
  "updatedAt": "2026-01-24T16:45:00Z"
}
```

**Error Responses:**
- 400: Missing diagnosis or symptoms
- 400: Invalid vitals (not JSON object)
- 400: Invalid attachments (not string array)
- 403: User lacks emr.write permission
- 404: Patient not found
- 500: Database error

---

### POST /prescriptions
**Create new prescription**

**Request Body:**
```json
{
  "patientId": "pat-123",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration": "30 days"
    },
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily",
      "duration": "indefinitely"
    }
  ],
  "instructions": "Take medications with food. Avoid grapefruit juice with Lisinopril."
}
```

**Response:** `201 Created`
```json
{
  "id": "rx-404",
  "patientId": "pat-123",
  "doctorId": "doc-555",
  "pharmacistId": null,
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration": "30 days"
    },
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily",
      "duration": "indefinitely"
    }
  ],
  "instructions": "Take medications with food. Avoid grapefruit juice with Lisinopril.",
  "dispensed": false,
  "dispensedAt": null,
  "createdAt": "2026-01-24T17:00:00Z",
  "updatedAt": "2026-01-24T17:00:00Z"
}
```

**Error Responses:**
- 400: Missing patientId
- 400: Empty medications array
- 400: Medication missing name/dosage/frequency
- 400: Missing instructions
- 403: User lacks prescription.create permission
- 404: Patient not found
- 500: Database error

---

### PATCH /prescriptions/:id
**Update prescription (before dispensing)**

**Path Parameters:**
- `id` (string, required): Prescription ID

**Request Body:**
```json
{
  "medications": [
    {
      "name": "Metformin",
      "dosage": "750mg",
      "frequency": "three times daily",
      "duration": "30 days"
    }
  ],
  "instructions": "Updated instructions"
}
```

**Response:** `200 OK`
```json
{
  "id": "rx-404",
  "patientId": "pat-123",
  "doctorId": "doc-555",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "750mg",
      "frequency": "three times daily",
      "duration": "30 days"
    }
  ],
  "instructions": "Updated instructions",
  "dispensed": false,
  "createdAt": "2026-01-24T17:00:00Z",
  "updatedAt": "2026-01-24T17:15:00Z"
}
```

**Error Responses:**
- 400: No updates provided
- 400: Prescription already dispensed (blocking)
- 400: Invalid medication structure
- 403: User lacks prescription.update permission
- 403: Prescription belongs to different doctor
- 404: Prescription not found
- 500: Database error

---

### POST /lab-results (Order Lab Tests)
**Order lab tests for patient**

**Request Body:**
```json
{
  "patientId": "pat-123",
  "testType": "Complete Blood Count (CBC)",
  "instructions": "Patient should be fasting for 8 hours",
  "priority": "ROUTINE"
}
```

**Response:** `201 Created`
```json
{
  "id": "lab-506",
  "patientId": "pat-123",
  "labTechId": null,
  "testType": "Complete Blood Count (CBC)",
  "instructions": "Patient should be fasting for 8 hours",
  "priority": "ROUTINE",
  "results": null,
  "status": "PENDING",
  "orderedAt": "2026-01-24T17:30:00Z",
  "completedAt": null,
  "createdAt": "2026-01-24T17:30:00Z",
  "updatedAt": "2026-01-24T17:30:00Z"
}
```

**Priority Options:**
- `ROUTINE` (default)
- `URGENT`

**Error Responses:**
- 400: Missing patientId or testType
- 400: Invalid priority
- 403: User lacks lab.order permission
- 403: Doctor has no access to patient
- 404: Patient not found
- 500: Database error

---

### GET /lab-results
**Get lab results for doctor's patients**

**Query Parameters:**
- `status` (string, optional): `PENDING`, `COMPLETED`, or `FAILED`
- `patientId` (string, optional): Filter by specific patient

**Example:**
```
GET /api/doctor/lab-results?status=COMPLETED&patientId=pat-123
```

**Response:**
```json
[
  {
    "id": "lab-506",
    "patientId": "pat-123",
    "labTechId": "tech-101",
    "testType": "Complete Blood Count (CBC)",
    "instructions": "Fasting required",
    "priority": "ROUTINE",
    "results": {
      "whiteBloodCells": "7.5 K/uL",
      "redBloodCells": "4.8 M/uL",
      "hemoglobin": "14.2 g/dL"
    },
    "status": "COMPLETED",
    "orderedAt": "2026-01-24T17:30:00Z",
    "completedAt": "2026-01-24T18:45:00Z",
    "createdAt": "2026-01-24T17:30:00Z",
    "updatedAt": "2026-01-24T18:45:00Z"
  }
]
```

---

### POST /surgeries
**Schedule a surgery**

**Request Body:**
```json
{
  "patientId": "pat-123",
  "surgeryType": "Appendectomy",
  "scheduledAt": "2026-02-15T09:00:00Z",
  "notes": "Emergency surgery. Patient fasting 6 hours before.",
  "anesthesiologist": "Dr. Sarah Johnson"
}
```

**Response:** `201 Created`
```json
{
  "surgery": {
    "id": "surg-607",
    "doctorId": "doc-555",
    "patientName": "John Doe",
    "surgeryType": "Appendectomy",
    "scheduledAt": "2026-02-15T09:00:00Z",
    "status": "SCHEDULED",
    "notes": "Emergency surgery. Patient fasting 6 hours before.",
    "anesthesiologist": "Dr. Sarah Johnson",
    "createdAt": "2026-01-24T18:00:00Z",
    "updatedAt": "2026-01-24T18:00:00Z"
  },
  "warning": null
}
```

**With Conflict Warning:**
```json
{
  "surgery": { ... },
  "warning": "Patient has 1 surgery(ies) scheduled within 24 hours"
}
```

**Error Responses:**
- 400: Missing required fields
- 400: Invalid date format
- 400: Date in the past
- 403: User lacks surgery.create permission
- 403: Doctor has no access to patient
- 404: Patient not found
- 500: Database error

---

### GET /appointments
**List doctor's appointments**

**Query Parameters:**
- `status` (string, optional): `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`
- `dateFrom` (ISO date, optional): Start date filter
- `dateTo` (ISO date, optional): End date filter

**Example:**
```
GET /api/doctor/appointments?status=SCHEDULED&dateFrom=2026-01-24&dateTo=2026-02-24
```

**Response:**
```json
[
  {
    "id": "apt-708",
    "patientId": "pat-123",
    "doctorId": "doc-555",
    "dateTime": "2026-02-01T14:00:00Z",
    "reason": "Follow-up checkup",
    "status": "SCHEDULED",
    "notes": "Check blood pressure and diabetes control",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }
]
```

---

### PATCH /appointments/:id
**Update appointment**

**Path Parameters:**
- `id` (string, required): Appointment ID

**Request Body:**
```json
{
  "status": "COMPLETED",
  "notes": "Patient responded well to treatment. Continue current medications."
}
```

**Response:** `200 OK`
```json
{
  "id": "apt-708",
  "patientId": "pat-123",
  "doctorId": "doc-555",
  "dateTime": "2026-02-01T14:00:00Z",
  "reason": "Follow-up checkup",
  "status": "COMPLETED",
  "notes": "Patient responded well to treatment. Continue current medications.",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-24T18:30:00Z"
}
```

**Error Responses:**
- 400: No updates provided
- 400: Invalid status value
- 403: User lacks appointment.update permission
- 403: Appointment belongs to different doctor
- 404: Appointment not found
- 500: Database error

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `403 Forbidden` - Authorization/permission error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Query Examples

### List today's appointments
```bash
curl -X GET "http://localhost:3000/api/doctor/appointments" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get patient with all details
```bash
curl -X GET "http://localhost:3000/api/doctor/patients/pat-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create EMR record
```bash
curl -X POST "http://localhost:3000/api/doctor/patients/pat-123/emr" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Hypertension",
    "symptoms": "High blood pressure",
    "vitals": {"bp": "150/90"}
  }'
```

### Order urgent lab test
```bash
curl -X POST "http://localhost:3000/api/doctor/lab-results" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pat-123",
    "testType": "Troponin",
    "priority": "URGENT",
    "instructions": "Stat test for chest pain evaluation"
  }'
```

### Schedule surgery with warning check
```bash
curl -X POST "http://localhost:3000/api/doctor/surgeries" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pat-123",
    "surgeryType": "Coronary Artery Bypass Graft",
    "scheduledAt": "2026-03-01T08:00:00Z",
    "anesthesiologist": "Dr. Michael Chen"
  }'
```

---

## Authentication

All endpoints require:
- Valid NextAuth session
- Specific RBAC permission for the operation
- Or valid emergency override token (`x-override-token` header)

---

## Rate Limits
Currently not enforced. Implement in middleware as needed.

---

**Last Updated:** January 24, 2026  
**Version:** Phase 1 Complete
