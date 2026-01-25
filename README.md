# CureOS - Hospital Information System

A comprehensive Hospital Information System (HIS) built with **Next.js 15**, **React 19**, and **TypeScript**, featuring real-time analytics, role-based access control, and modern Apple HCI-inspired UI/UX.



## ✨ Current Features

### Core Capabilities
- 🏥 **22 Hospital Modules**: Complete coverage across 5 functional domains (Clinical, Administrative, Financial, Lab, Support)
- 👥 **Multi-Role Support**: Admin, Doctor, Nurse, Pharmacist, Lab Tech, Receptionist, Emergency
- 📊 **Real-time Analytics Dashboard**: 7-department analytics with live data visualization
- 🔐 **Advanced RBAC**: Role-based access control with granular permission management
- 💬 **Professional Sidebar Navigation**: Dynamic role-aware navigation with team switcher
- 📱 **Responsive Design**: Mobile-first approach with collapsible sidebar

### Department Analytics (7 Modules)
- **Billing** - Financial operations & revenue tracking
- **Emergency** - Emergency department operations
- **Nursing** - Patient care & bed management
- **Clinical** - EMR & patient records
- **Pharmacy** - Prescription & inventory management
- **Laboratory** - Lab tests & results
- **Surgery** - Operation theater management

### Data & Integration
- 🗄️ **PostgreSQL Database**: Comprehensive Prisma ORM schema
- 🔄 **Real-time Updates**: Socket.io integration ready
- 📈 **Smart Analytics**: 7-day trend analysis with actual database queries
- 🔐 **Secure Auth**: NextAuth.js v4 with session management

## 🚀 Recent Updates (January 2026)

- ✅ React 19 compatibility (lucide-react v0.408.0)
- ✅ Gooey morphing tab effects with smooth animations
- ✅ Professional sidebar-02 component with role-based routes
- ✅ Logout button in sidebar footer
- ✅ Real database integration for all analytics
- ✅ Organized documentation structure
- ✅ Apple HCI-inspired neutral color scheme

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Framer Motion (motion/react) |
| **Backend** | Next.js API Routes, NextAuth v4 |
| **Database** | PostgreSQL, Prisma ORM |
| **Real-time** | Socket.io |
| **Icons** | Lucide React v0.408.0 |

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/CureOS.git
   cd CureOS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000

## 📁 Project Structure

```
CureOS/
├── docs/                   # Organized documentation
│   ├── guides/            # Implementation guides
│   ├── architecture/       # System architecture
│   ├── deployment/        # Deployment guides
│   ├── modules/           # Module documentation
│   ├── reference/         # API & permission references
│   └── summaries/         # Project summaries
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth pages
│   │   ├── (dashboard)/   # Role-based dashboards
│   │   └── api/           # API endpoints
│   ├── components/
│   │   ├── admin/         # Admin components
│   │   ├── dashboards/    # Role dashboards
│   │   ├── sidebar-02/    # Modern sidebar
│   │   ├── stats-10/      # Analytics cards
│   │   ├── gooey-*        # Morphing effects
│   │   └── ui/            # UI components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── services/          # Business logic
│   └── types/             # Type definitions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed-rbac.ts       # Database seed
└── server.ts              # Socket.io server
```

## 🔐 Security & Authentication

### Features
- **RBAC System**: Role-based access control with atomic permissions
- **Session Management**: NextAuth.js v4 with JWT enhancement
- **Emergency Override**: Time-limited, single-use override tokens
- **Audit Logging**: Immutable audit trail for sensitive operations
- **Permission Scopes**: Fine-grained permission management

### Core API Endpoints
- `GET /api/admin/roles` - List all roles
- `POST /api/admin/roles` - Create role
- `GET /api/admin/permissions` - List permissions
- `GET /api/admin/users` - List users
- `POST /api/auth/override` - Emergency override request

## 🎨 UI/UX Highlights

- **Gooey Morphing Effects**: Smooth tab transitions with SVG filter animations
- **Real-time Analytics**: 7-day trend visualization with actual database data
- **Dark Mode**: Full dark mode support across all components
- **Apple HCI Design**: Clean, minimal, focus-driven interface
- **Mobile Responsive**: Adaptive layout with collapsible navigation
- **Performance Optimized**: Lazy loading, code splitting, optimized re-renders

## 📊 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

This project is proprietary - All rights reserved

## 💡 Support

For questions or issues:
- Check the [documentation](docs/)
- Open an issue on GitHub
- Review the [API Reference](docs/reference/)

