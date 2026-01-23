# Doctor Module - Phase 3 Implementation Plan

**Status:** Starting  
**Date:** January 24, 2026  
**Features:** 5 short-term enhancements  

---

## 🎯 Phase 3 Features

### 1. EMR Versioning (History Tracking)
**Goal:** Track all changes to EMR records, allow viewing/restoring previous versions

**Changes:**
- Prisma: Create EMRVersion table to store historical records
- API: 
  - GET /api/doctor/patients/:id/emr/:emrId/versions - List all versions
  - GET /api/doctor/patients/:id/emr/:emrId/versions/:versionId - View specific version
  - POST /api/doctor/patients/:id/emr/:emrId/restore - Restore to previous version
- Frontend: EMR version history sidebar, version diff viewer
- Audit: Track who made changes and when

**Database Schema:**
```prisma
model EMRVersion {
  id String @id @default(cuid())
  emrId String
  emr EMRRecord @relation(fields: [emrId], references: [id], onDelete: Cascade)
  
  // Snapshot of EMR at this version
  diagnosis String
  symptoms String
  vitals Json?
  notes String?
  
  // Version metadata
  versionNumber Int
  changedBy String // doctorId
  changedAt DateTime @default(now())
  changeNotes String? // What was changed and why
}
```

---

### 2. Break-glass Access
**Goal:** Allow doctors to access patient records in emergencies when normal RBAC is too restrictive

**Changes:**
- Prisma: Add BreakGlassAccess table, BreakGlassLog table
- API:
  - POST /api/doctor/break-glass/request - Request emergency access
  - GET /api/doctor/break-glass/requests - View pending requests
  - POST /api/doctor/break-glass/approve/:id - Approve request (admin only)
  - GET /api/doctor/break-glass/logs - View access logs
  - POST /api/doctor/break-glass/revoke/:id - Revoke access
- Frontend: Break-glass request form, access logs viewer
- Security: Require justification, 2-person approval, immutable logs

**Database Schema:**
```prisma
model BreakGlassAccess {
  id String @id @default(cuid())
  doctorId String
  patientId String
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  status String // PENDING, APPROVED, REVOKED
  justification String
  approvedBy String? // adminId
  approvedAt DateTime?
  revokedAt DateTime?
  expiresAt DateTime // Auto-revoke after duration
  
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())
}

model BreakGlassLog {
  id String @id @default(cuid())
  accessId String
  action String // CREATED, APPROVED, USED, REVOKED
  performedBy String
  details Json?
  createdAt DateTime @default(now())
}
```

---

### 3. Patient Consent Management
**Goal:** Track patient consent for treatments, surgeries, procedures

**Changes:**
- Prisma: Add Consent table
- API:
  - POST /api/doctor/patients/:id/consent - Create consent form
  - GET /api/doctor/patients/:id/consents - List patient consents
  - PATCH /api/doctor/patients/:id/consent/:id - Update consent status
  - GET /api/doctor/patients/:id/consent/:id/pdf - Generate PDF
- Frontend: Consent form builder, consent status tracker, digital signature capture
- Features: Templates for common procedures, PDF generation, signature tracking

**Database Schema:**
```prisma
model Consent {
  id String @id @default(cuid())
  patientId String
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  type String // SURGERY, PROCEDURE, TREATMENT, ANESTHESIA, etc.
  title String
  description String
  procedures String[] // Related procedure IDs
  
  status String // PENDING, SIGNED, REVOKED
  signedAt DateTime?
  signedByPatient Boolean @default(false)
  signedByGuardian Boolean @default(false)
  
  createdBy String // doctorId
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())
  
  // Signature data
  patientSignature String? // Digital signature
  guardianSignature String?
  pdfUrl String? // Generated PDF URL
}
```

---

### 4. File Upload for EMR
**Goal:** Allow attaching documents (test results, images, scans) to EMR records

**Changes:**
- Prisma: Add EMRAttachment table
- API:
  - POST /api/doctor/patients/:id/emr/:emrId/upload - Upload file
  - GET /api/doctor/patients/:id/emr/:emrId/attachments - List files
  - DELETE /api/doctor/patients/:id/emr/:emrId/attachments/:id - Delete file
  - GET /api/doctor/patients/:id/emr/:emrId/attachments/:id/download - Download file
- Storage: Use S3 or local file system
- Frontend: File upload widget, attachment list, preview modal
- Security: Virus scan, file type validation, access control

**Database Schema:**
```prisma
model EMRAttachment {
  id String @id @default(cuid())
  emrId String
  emr EMRRecord @relation(fields: [emrId], references: [id], onDelete: Cascade)
  
  fileName String
  fileType String // mime type
  fileSize Int // bytes
  fileUrl String // S3 or local path
  
  uploadedBy String // doctorId
  uploadedAt DateTime @default(now())
  
  // Optional metadata
  description String?
  category String? // SCAN, LAB_RESULT, XRAY, etc.
}
```

---

### 5. Advanced Filtering & Search
**Goal:** Better search and filtering for patient lists, EMR records, prescriptions

**Changes:**
- API: Enhance existing routes with new query parameters
  - /api/doctor/patients?search=&gender=&bloodType=&status=&dateFrom=&dateTo=
  - /api/doctor/patients/:id/emr?diagnosis=&symptoms=&dateFrom=&dateTo=&severity=
  - /api/doctor/prescriptions?status=&medication=&patientName=
- Frontend: Advanced filter UI with date ranges, multi-select, text search
- Database: Add indexes for common filter fields

---

## 📊 Implementation Timeline

| Feature | Priority | Complexity | Est. Time |
|---------|----------|-----------|-----------|
| EMR Versioning | High | Medium | 2-3 hours |
| Break-glass Access | High | High | 3-4 hours |
| Patient Consent | Medium | Medium | 2-3 hours |
| File Upload | Medium | Medium | 2-3 hours |
| Advanced Filtering | Low | Low | 1-2 hours |

---

## 🚀 Implementation Order

1. **EMR Versioning** (easiest, high value)
   - Prisma migration
   - API routes (3 endpoints)
   - Frontend components (version list, diff viewer)
   - Hook functions

2. **Advanced Filtering** (dependencies for other features)
   - API enhancements
   - Frontend filter UI

3. **Patient Consent** (medium complexity)
   - Prisma migration
   - API routes (4 endpoints)
   - Frontend consent form builder
   - PDF generation

4. **File Upload** (medium complexity)
   - Prisma migration
   - API routes (4 endpoints)
   - Frontend upload widget
   - Storage setup

5. **Break-glass Access** (most complex, high security)
   - Prisma migration
   - API routes (5 endpoints)
   - Frontend request/approval UI
   - Admin approval flow
   - Audit logging

---

## 🎯 Next Step

Starting with **EMR Versioning** - creating Prisma migration and API routes.
