# RBAC UI - Visual Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CureOS Admin Interface                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Admin Dashboard                        │   │
│  │  ┌──────────────────┐  ┌──────────────────┐             │   │
│  │  │ RBAC Module      │  │ Users Module     │  [More...]  │   │
│  │  └────────┬─────────┘  └──────────────────┘             │   │
│  └───────────┼──────────────────────────────────────────────┘   │
│              │                                                    │
│  ┌───────────▼──────────────────────────────────────────────┐   │
│  │              RBAC Page (/admin/rbac)                     │   │
│  │                                                           │   │
│  │  ┌────────┬────────┬─────────┬─────────────────────────┐ │   │
│  │  │Overview│ Roles  │ Users   │ Permissions             │ │   │
│  │  └────────┴────────┴─────────┴─────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │       Selected Tab Content                          │ │   │
│  │  │  (Roles / Users / Permissions Management)           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                                                    │
│              │                                                    │
└──────────────┼────────────────────────────────────────────────────┘
               │
               │ React Hooks
               │ (useRoles, useUsers, usePermissions)
               │
        ┌──────▼──────────────┐
        │  Next.js API Routes │
        │  /api/admin/*       │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────┐
        │  Services Layer     │
        │  (role.service.ts   │
        │   auth.service.ts)  │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────┐
        │  Prisma ORM        │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────┐
        │  PostgreSQL DB      │
        │  (Roles, Perms,     │
        │   Users, Audit)     │
        └─────────────────────┘
```

---

## Component Hierarchy

```
RBACPage
├── Overview Tab
│   ├── Introduction Text
│   ├── Feature Cards
│   │   ├── Roles Card
│   │   ├── Users Card
│   │   ├── Permissions Card
│   │   └── Security Card
│   └── Best Practices Box
│
├── Roles Tab
│   └── RolesManagement
│       ├── Header with "New Role" Button
│       ├── System Roles Section
│       │   └── Role Cards (non-editable delete)
│       ├── Custom Roles Section
│       │   └── Role Cards (editable delete)
│       └── Create/Edit Modal
│           ├── Name Input
│           ├── Permission Checkboxes
│           └── Submit/Cancel Buttons
│
├── Users Tab
│   └── UsersManagement
│       ├── Header with "New User" Button
│       ├── Users Table
│       │   ├── Name Column
│       │   ├── Email Column
│       │   ├── Role Column
│       │   ├── Created Column
│       │   └── Actions Column
│       └── Create/Edit Modal
│           ├── Name Input
│           ├── Email Input
│           ├── Password Input (with toggle)
│           ├── Role Dropdown
│           └── Submit/Cancel Buttons
│
└── Permissions Tab
    └── PermissionsManagement
        ├── Header with "New Permission" Button
        ├── Permissions by Category
        │   ├── Patients Permissions
        │   ├── Prescriptions Permissions
        │   ├── Emergency Permissions
        │   └── Other Permissions
        └── Create Modal
            ├── Text Area (multi-line input)
            └── Submit/Cancel Buttons
```

---

## Data Flow Diagram

```
┌──────────────────┐
│  User Action     │
│ (e.g., Edit Role)│
└────────┬─────────┘
         │
    ┌────▼────┐
    │  Form   │
    │Validation
    └────┬────┘
         │
  ┌──────▼──────────┐
  │ useRoles Hook   │
  │ .updateRole()   │
  └────────┬────────┘
           │
   ┌───────▼───────┐
   │ fetch() to    │
   │ /api/admin/   │
   │ roles/:id     │
   │ (PUT method)  │
   └───────┬───────┘
           │
   ┌───────▼─────────────┐
   │ API Route Handler   │
   │ - Check permission  │
   │ - Validate request  │
   │ - Update database   │
   │ - Log audit event   │
   └───────┬─────────────┘
           │
   ┌───────▼─────────────┐
   │ Database Update     │
   │ - Update RoleEntity │
   │ - Update Role       │
   │   Permissions       │
   │ - Create AuditLog   │
   └───────┬─────────────┘
           │
   ┌───────▼──────────────┐
   │ Response with        │
   │ Updated Role Data    │
   └───────┬──────────────┘
           │
   ┌───────▼──────────────┐
   │ Hook Updates State   │
   │ & Local Cache        │
   └───────┬──────────────┘
           │
   ┌───────▼──────────────┐
   │ Component Re-renders │
   │ with New Data        │
   └─────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────┐
│     Component Local State           │
├─────────────────────────────────────┤
│ - showCreateModal: boolean          │
│ - editingRoleId: string | null      │
│ - formData: {name, permissions}     │
│ - formError: string                 │
│ - isSubmitting: boolean             │
└──────────┬──────────────────────────┘
           │
   ┌───────▼─────────────────────┐
   │   Hook State (useRoles)     │
   ├─────────────────────────────┤
   │ - roles: RoleEntity[]       │
   │ - loading: boolean          │
   │ - error: string | null      │
   └──────────┬──────────────────┘
              │
      ┌───────▼──────────────┐
      │  API Response Cache  │
      ├──────────────────────┤
      │ - roles list         │
      │ - users list         │
      │ - permissions list   │
      └──────────────────────┘
```

---

## Permission Enforcement Flow

```
┌──────────────────────────────┐
│ User Tries to Access Feature │
└────────────┬─────────────────┘
             │
    ┌────────▼─────────────┐
    │ Check Session Auth   │
    │ (NextAuth)           │
    └────────┬─────────────┘
             │
      ┌──────▼──────────────┐
      │ Is User Logged In?  │
      ├──────┬──────────────┤
      │ No   │ Yes          │
      │      │              │
    ┌─▼─┐   │         ┌─────▼──────┐
    │401│   │         │ Get User's  │
    │   │   │         │ Role        │
    └───┘   │         └─────┬───────┘
            │               │
            │        ┌──────▼──────────┐
            │        │ Load Role       │
            │        │ Permissions     │
            │        │ from DB         │
            │        └──────┬──────────┘
            │               │
            │        ┌──────▼──────────────┐
            │        │ Check if User has   │
            │        │ Required Permission │
            │        └──────┬─────────────┘
            │               │
            │        ┌──────┴──────┐
            │        │ Yes   │ No  │
            │        │       │     │
            │   ┌────▼─┐  ┌─▼────┐
            │   │Allow │  │Deny  │
            │   │      │  │(403) │
            │   └──────┘  └──────┘
            │
            └────────────────────────────┘
```

---

## Database Schema Visualization

```
┌──────────────────┐
│    User          │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password (hash)  │
│ name             │
│ roleEntityId(FK) │◄─────────────┐
│ createdAt        │              │
│ updatedAt        │              │
└──────────────────┘              │
                                  │
                    ┌─────────────┴──────────┐
                    │                        │
              ┌─────▼──────────┐   ┌────────▼────────┐
              │   RoleEntity   │   │  Permission     │
              ├────────────────┤   ├─────────────────┤
              │ id (PK)        │   │ id (PK)         │
              │ name (UNIQUE)  │   │ name (UNIQUE)   │
              │ description    │   │ description     │
              │ createdAt      │   │ createdAt       │
              │ updatedAt      │   │ updatedAt       │
              └────────┬───────┘   └────────┬────────┘
                       │                    │
                       │                    │
                ┌──────▼────────────────────▼──┐
                │   RolePermission             │
                │   (Junction Table)           │
                ├──────────────────────────────┤
                │ id (PK)                      │
                │ roleId (FK) ──┐              │
                │ permissionId   │ (UNIQUE)    │
                │ (FK) ──────────┼─────┐       │
                │ createdAt      │     │       │
                └────────────────┼─────┼───────┘
                                 │     │
                            (Unique constraint)
                                 │     │
            ┌────────────────────┘     │
            │                          │
    ┌───────▼──────────┐    ┌─────────▼──────┐
    │ RoleEntity       │    │ Permission     │
    │ (Many Roles)     │    │ (Many Perms)   │
    └──────────────────┘    └────────────────┘
```

---

## API Endpoint Map

```
┌─────────────────────────────────────────────────────────┐
│            /api/admin/                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────┐   │
│  │   /roles            │   │    /users            │   │
│  ├─────────────────────┤   ├──────────────────────┤   │
│  │ GET  - List roles   │   │ GET - List users     │   │
│  │ POST - Create role  │   │ POST - Create user   │   │
│  └──────────┬──────────┘   └─────────┬────────────┘   │
│             │                        │                 │
│  ┌──────────▼──────────┐   ┌────────▼─────────────┐  │
│  │ /roles/:id          │   │ /users/:id           │  │
│  ├─────────────────────┤   ├──────────────────────┤  │
│  │ GET - Get role      │   │ GET - Get user       │  │
│  │ PUT - Update role   │   │ PUT - Update user    │  │
│  │ DELETE - Delete     │   │ DELETE - Delete user │  │
│  └─────────────────────┘   └──────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │        /permissions                             │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ GET - List permissions                          │ │
│  │ POST - Create permissions (bulk)                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │        /audit (future)                          │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ GET - List audit logs                           │ │
│  │ POST - Create audit log                         │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## Hook Dependencies Flow

```
Component Renders
       │
       ├─── useRoles() ────────────┐
       │    │                      │
       │    ├─ fetchRoles()   ─────┼──── GET /api/admin/roles
       │    │                      │
       │    ├─ createRole()   ─────┼──── POST /api/admin/roles
       │    │                      │
       │    ├─ updateRole()   ─────┼──── PUT /api/admin/roles/:id
       │    │                      │
       │    └─ deleteRole()   ─────┼──── DELETE /api/admin/roles/:id
       │                           │
       ├─── useUsers() ────────────┤
       │    │                      │
       │    ├─ fetchUsers()   ─────┼──── GET /api/admin/users
       │    │                      │
       │    ├─ createUser()   ─────┼──── POST /api/admin/users
       │    │                      │
       │    ├─ updateUser()   ─────┼──── PUT /api/admin/users/:id
       │    │                      │
       │    └─ deleteUser()   ─────┼──── DELETE /api/admin/users/:id
       │                           │
       └─── usePermissions() ──────┤
            │                      │
            ├─ fetchPermissions()  ┼──── GET /api/admin/permissions
            │                      │
            └─ createPermissions() ┼──── POST /api/admin/permissions
                                   │
                                   └──────────────────────────────────
```

---

## UI Component Tree

```
RBACPage (main page)
│
├─ <Header>
│   └─ "Role-Based Access Control" title
│
├─ <TabNavigation>
│   ├─ Overview Tab
│   ├─ Roles Tab
│   ├─ Users Tab
│   └─ Permissions Tab
│
├─ <TabContent>
│   │
│   ├─ OverviewTab
│   │   ├─ IntroductionCard
│   │   ├─ FeatureCard (Roles)
│   │   ├─ FeatureCard (Users)
│   │   ├─ FeatureCard (Permissions)
│   │   ├─ FeatureCard (Security)
│   │   └─ BestPracticesBox
│   │
│   ├─ RolesTab → RolesManagement
│   │   ├─ Header + New Button
│   │   ├─ SystemRolesSection
│   │   │   └─ RoleCard[] (read-only delete)
│   │   ├─ CustomRolesSection
│   │   │   └─ RoleCard[] (full edit)
│   │   └─ CreateEditModal
│   │       ├─ NameInput
│   │       ├─ PermissionCheckboxes
│   │       └─ Buttons
│   │
│   ├─ UsersTab → UsersManagement
│   │   ├─ Header + New Button
│   │   ├─ UsersTable
│   │   │   ├─ NameColumn
│   │   │   ├─ EmailColumn
│   │   │   ├─ RoleColumn
│   │   │   ├─ CreatedColumn
│   │   │   └─ ActionsColumn
│   │   └─ CreateEditModal
│   │       ├─ NameInput
│   │       ├─ EmailInput
│   │       ├─ PasswordInput
│   │       ├─ RoleDropdown
│   │       └─ Buttons
│   │
│   └─ PermissionsTab → PermissionsManagement
│       ├─ Header + New Button
│       ├─ PermissionsByCategory
│       │   ├─ PatientsSection
│       │   ├─ PrescriptionsSection
│       │   ├─ EmergencySection
│       │   └─ OtherSection
│       └─ CreateModal
│           ├─ TextArea
│           └─ Buttons
│
└─ <RBACGuide> (optional)
    ├─ HowRBACWorks
    ├─ DefaultRolesTable
    ├─ SecurityFeatures
    └─ PermissionConventions
```

---

## File Organization

```
src/
├── app/
│   └── (dashboard)/
│       └── admin/
│           ├── page.tsx .................... Admin Dashboard
│           └── rbac/
│               └── page.tsx ................. RBAC Main Page
│
├── components/
│   └── rbac/
│       ├── roles-management.tsx ............. Roles UI
│       ├── users-management.tsx ............. Users UI
│       ├── permissions-management.tsx ....... Permissions UI
│       └── rbac-guide.tsx ................... Education Component
│
├── hooks/
│   └── use-rbac.ts .......................... API Hooks
│
├── lib/
│   ├── authorization.ts .................... Auth middleware
│   ├── auth.ts ............................. NextAuth config
│   └── prisma.ts ........................... DB client
│
└── services/
    ├── role.service.ts .................... Role logic
    └── permission.service.ts .............. Permission logic

Documentation/
├── RBAC_UI_DOCUMENTATION.md ............... User Guide
├── IMPLEMENTATION_SUMMARY.md ............. Tech Overview
├── RBAC_QUICK_START.md ................... Quick Start
└── DEPLOYMENT_CHECKLIST.md ............... Deploy Guide
```

---

This visual architecture provides a comprehensive overview of the RBAC UI system structure and data flows.
