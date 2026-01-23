# Patient Registration Feature

## Overview

The Patient Registration page allows receptionists to register new patients into the hospital management system with a modern, user-friendly interface.

## Location

**Route:** `/receptionist/registration`

**File:** `src/app/(dashboard)/receptionist/registration/page.tsx`

## Features

### 1. **Modern UI Design**

- Gradient backgrounds matching the landing page aesthetic (blue-themed)
- Smooth animations and transitions
- Responsive design for all screen sizes
- Card-based layout for better organization

### 2. **Form Sections**

#### Personal Information Card

- First Name\* (required)
- Last Name\* (required)
- Gender\* (required - Radio buttons: Male, Female, Other)
- Date of Birth\* (required)
- Phone Number\* (required)
- Email Address (optional)
- Residential Address (optional)

#### Medical Information Card

- Blood Group (dropdown: A+, A-, B+, B-, O+, O-, AB+, AB-)
- Emergency Contact (phone number)

### 3. **Form Validation**

- Required fields marked with red asterisk (\*)
- HTML5 validation for email and phone inputs
- Date picker for Date of Birth
- Real-time field validation

### 4. **Success Feedback**

After successful registration:

- Animated success card with green theme
- Display generated Patient ID (first 8 characters of UUID)
- Patient details summary
- Options to:
  - Register another patient
  - Return to dashboard

### 5. **API Integration**

- **Endpoint:** `POST /api/patients`
- **Permissions:** Requires `patients.create` permission
- **Response:** Returns complete patient object with generated ID
- **Error Handling:** Toast notifications for success/failure

### 6. **Toast Notifications**

- Success message with patient details
- Error handling with descriptive messages
- Non-blocking UI notifications

## UI Components Used

All components follow the project's design system:

- `Button` - Primary actions
- `Card` - Content containers
- `Input` - Text inputs with icon support
- `Label` - Form labels
- `Select` - Dropdown selections
- `RadioGroup` - Gender selection
- `Textarea` - Address input
- `Toast` - Notifications

## Color Scheme

Matching the landing page design:

- **Primary Blue:** `#2563eb` (Blue-600)
- **Success Green:** `#10b981` (Emerald-500)
- **Backgrounds:** Blue gradients (`from-blue-50 to-blue-100`)
- **Text:** Slate shades for hierarchy

## Icons Used

From `lucide-react`:

- `UserPlus` - Registration header
- `User` - Personal info
- `Phone` - Phone inputs
- `Mail` - Email input
- `MapPin` - Address input
- `Calendar` - Date of birth
- `Droplet` - Blood group
- `Save` - Submit button
- `ArrowLeft` - Back navigation
- `CheckCircle2` - Success state

## Navigation

- **Back Button:** Returns to `/receptionist` dashboard
- **After Registration:** Options to register another or go to dashboard

## Receptionist Dashboard

Enhanced receptionist dashboard at `/receptionist`:

### Quick Actions

1. **New Registration** - Links to registration page
2. **Patient List** - View all patients
3. **Appointments** - Schedule appointments
4. **Reports** - View daily reports

### Statistics Cards

- Today's Registrations
- Appointments Scheduled
- Active Patients

## Database Schema

Patient records are stored with:

```typescript
{
  id: string (auto-generated UUID)
  firstName: string
  lastName: string
  email: string | null
  phone: string
  dateOfBirth: DateTime
  gender: string
  address: string | null
  bloodType: string | null
  emergencyContact: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Installation

Required dependencies (already installed):

```bash
npm install @radix-ui/react-select @radix-ui/react-radio-group @radix-ui/react-toast
```

## Usage

1. Navigate to receptionist dashboard: `/receptionist`
2. Click "New Registration" card
3. Fill in required patient information
4. Click "Register Patient" button
5. View success confirmation with Patient ID
6. Choose to register another patient or return to dashboard

## Permissions Required

- `patients.create` - To register new patients

## Future Enhancements

Potential improvements:

- Photo upload for patient profile
- Insurance information capture
- Medical history import
- QR code generation for patient ID
- Print patient card
- SMS notification to patient
- Integration with appointment scheduling
