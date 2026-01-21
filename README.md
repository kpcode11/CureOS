# Cureos Hospital Management System

A comprehensive hospital management system built with Next.js, TypeScript, and Prisma.

## Features

- 🏥 **Multi-Role Support**: Admin, Doctor, Nurse, Pharmacist, Lab Tech, Receptionist, Emergency
- 👥 **Patient Management**: Complete EMR system with patient records
- 💊 **Pharmacy Management**: Prescription tracking and dispensing
- 🧪 **Laboratory**: Lab test orders and results management
- 🛏️ **Bed Management**: Track bed availability and assignments
- 💰 **Billing & Insurance**: Comprehensive billing and insurance management
- 🚨 **Emergency Management**: Real-time emergency case tracking
- 🔔 **Real-time Notifications**: WebSocket-based live updates
- 🔐 **Secure Authentication**: NextAuth.js with role-based access control

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (configurable to SQLite)
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **UI Components**: Radix UI, Shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (or SQLite)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/cureos-hospital-system.git
cd cureos-hospital-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file and add:
DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. (Optional) Seed the database:
```bash
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The system includes models for:
- Users (with role-based authentication)
- Patients
- Doctors, Nurses, Pharmacists, Lab Technicians
- Appointments
- EMR (Electronic Medical Records)
- Prescriptions
- Lab Tests
- Surgeries
- Bed Management
- Billing & Insurance
- Emergency Cases
- Incident Reporting
- Inventory Management

## Project Structure

```
cureos-hospital-system/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── (auth)/     # Authentication pages
│   │   ├── (dashboard)/# Dashboard pages for different roles
│   │   └── api/        # API routes
│   ├── components/     # React components
│   │   ├── dashboards/ # Role-specific dashboards
│   │   ├── forms/      # Form components
│   │   ├── shared/     # Shared components
│   │   └── ui/         # UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and configs
│   ├── services/       # Business logic and data services
│   ├── store/          # State management (Zustand)
│   └── types/          # TypeScript type definitions
└── server.ts           # Socket.io server

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Author

Built with ❤️ by [Your Name]

## Support

For support, email your-email@example.com or open an issue in the repository.
