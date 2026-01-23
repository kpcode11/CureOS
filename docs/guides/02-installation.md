# Installation Guide

Complete step-by-step setup instructions for CureOS Hospital Management System.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (or Neon PostgreSQL)
- npm or yarn package manager
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/cureos-hospital-system.git
cd cureos-hospital-system
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-secure-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# For Production (optional)
NODE_ENV="development"
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Step 4: Set Up Database

### Option A: Local PostgreSQL

```bash
# Create database
createdb hospital_db

# Run migrations
npx prisma migrate dev

# Seed default data
npm run prisma:seed
```

### Option B: Neon PostgreSQL

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set as DATABASE_URL in `.env`
5. Run:

```bash
npx prisma migrate dev
npm run prisma:seed
```

## Step 5: Verify Installation

```bash
# Check database connection
npx prisma db execute --stdin < /dev/null

# Verify schema
npx prisma generate
```

## Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 7: Login

1. Navigate to `http://localhost:3000/login`
2. Use default admin credentials:
   - **Email:** `admin@neon.example`
   - **Password:** `N3on$Adm1n!x9Qv7sR2#tY4P`

## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check firewall/network settings

### Prisma Client Error
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## Next Steps

- [Quick Start Guide](./01-quick-start.md) - Get started in 5 minutes
- [System Overview](./03-system-overview.md) - Understand the architecture
- [API Endpoints](./04-api-endpoints.md) - Explore available APIs
