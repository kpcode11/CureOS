# RBAC (Role-Based Access Control) UI Documentation

## Overview

The RBAC UI provides a comprehensive interface for managing roles, users, and permissions in the CureOS hospital management system. It is built on top of a fully functional backend RBAC system with proper authorization checks and audit logging.

## Features

### ✅ Backend Implementation Status

The RBAC backend is **fully implemented** with the following features:

- **Permission Model**: Flexible permission system with arbitrary permission names
- **Role Model**: RoleEntity with many-to-many relationship to permissions
- **User-Role Mapping**: Users can be assigned specific roles
- **Authorization Middleware**: `requirePermission()` guards all sensitive API endpoints
- **Audit Logging**: All RBAC changes are logged to AuditLog for compliance
- **Emergency Overrides**: Secure token-based emergency access mechanism
- **Database Seeding**: Pre-configured system roles (ADMIN, DOCTOR, NURSE, etc.)

### ✅ UI Components

#### 1. **RBAC Dashboard** (`/admin/rbac`)
Main entry point with 4 tabs:
- **Overview**: Introduction and quick access to management modules
- **Roles**: Full role management interface
- **Users**: User management with role assignment
- **Permissions**: Permission management interface

#### 2. **Roles Management** (`components/rbac/roles-management.tsx`)
Features:
- View all roles (system and custom)
- Create new custom roles
- Edit existing roles
- Assign/remove permissions
- Delete custom roles (ADMIN role cannot be deleted)
- Bulk permission management

#### 3. **Users Management** (`components/rbac/users-management.tsx`)
Features:
- View all users in a table format
- Create new users with name, email, password
- Assign roles to users
- Edit user information and role assignment
- Reset user password
- Delete users (cannot delete self)
- Visual role badges

#### 4. **Permissions Management** (`components/rbac/permissions-management.tsx`)
Features:
- View all permissions grouped by category
- Create new permissions (bulk import)
- Organize permissions by category (e.g., patients.*, prescriptions.*)
- View permission metadata

## File Structure

```
src/
├── hooks/
│   └── use-rbac.ts                          # Custom hooks for RBAC API calls
├── components/rbac/
│   ├── roles-management.tsx                 # Roles UI component
│   ├── users-management.tsx                 # Users UI component
│   └── permissions-management.tsx           # Permissions UI component
├── app/(dashboard)/admin/
│   ├── page.tsx                             # Enhanced admin dashboard
│   └── rbac/
│       └── page.tsx                         # RBAC main page
└── app/api/admin/                           # Backend API (already implemented)
    ├── roles/route.ts                       # GET/POST roles
    ├── roles/[id]/route.ts                  # GET/PUT/DELETE role by ID
    ├── users/route.ts                       # GET/POST users
    ├── users/[id]/route.ts                  # GET/PUT/DELETE user by ID
    └── permissions/route.ts                 # GET/POST permissions
```

## API Hooks

### `usePermissions()`
```typescript
const { permissions, loading, error, fetchPermissions, createPermissions } = usePermissions();
```

**Methods:**
- `fetchPermissions()` - Fetch all permissions
- `createPermissions(names: string[])` - Create multiple permissions at once

---

### `useRoles()`
```typescript
const { roles, loading, error, fetchRoles, createRole, updateRole, deleteRole } = useRoles();
```

**Methods:**
- `fetchRoles()` - Fetch all roles with their permissions
- `createRole(name: string, permissions?: string[])` - Create a new role
- `updateRole(roleId: string, name?: string, permissions?: string[])` - Update role
- `deleteRole(roleId: string)` - Delete a custom role

---

### `useUsers()`
```typescript
const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers();
```

**Methods:**
- `fetchUsers()` - Fetch all users
- `createUser(email: string, password: string, name: string, roleEntityId?: string)` - Create user
- `updateUser(userId: string, updates: {...})` - Update user information
- `deleteUser(userId: string)` - Delete a user

## System Roles

Pre-configured roles with their default permissions:

| Role | Permissions | Description |
|------|-------------|-------------|
| ADMIN | All permissions | System administrator with full access |
| DOCTOR | patients.read, prescriptions.create, prescriptions.dispense | Medical practitioner |
| NURSE | patients.read, prescriptions.read | Nursing staff |
| PHARMACIST | prescriptions.read, prescriptions.dispense | Pharmacy staff |
| LAB_TECH | lab.* | Lab technician |
| RECEPTIONIST | patients.create, appointments.* | Front desk staff |
| EMERGENCY | emergency.request | Emergency personnel |

## Default Permissions

The seeding script creates these default permissions:

- `patients.create` - Create patient records
- `patients.read` - Read patient records
- `patients.update` - Update patient records
- `patients.delete` - Delete patient records
- `prescriptions.create` - Create prescriptions
- `prescriptions.dispense` - Dispense medications
- `emergency.request` - Request emergency access
- `audit.read` - Read audit logs
- `roles.manage` - Manage roles and permissions
- `users.manage` - Manage user accounts

## Usage Examples

### Creating a New Role

```typescript
const { createRole } = useRoles();

try {
  const newRole = await createRole('Clinical Supervisor', [
    'patients.read',
    'patients.update',
    'prescriptions.read',
  ]);
  // Role created successfully
} catch (error) {
  console.error('Failed to create role:', error);
}
```

### Creating a New User

```typescript
const { createUser } = useUsers();

try {
  const newUser = await createUser(
    'john.doe@hospital.com',
    'SecurePassword123!',
    'John Doe',
    roleEntityId // ID of the role to assign
  );
  // User created successfully
} catch (error) {
  console.error('Failed to create user:', error);
}
```

### Updating User Role

```typescript
const { updateUser } = useUsers();

try {
  await updateUser(userId, {
    roleEntityId: newRoleId,
    name: 'Updated Name',
  });
} catch (error) {
  console.error('Failed to update user:', error);
}
```

## UI/UX Features

### Design Elements
- **Color Coding**: Each section uses distinct colors (Blue for roles, Green for users, Purple for permissions)
- **Icons**: Lucide React icons for intuitive navigation
- **Responsive Design**: Works on desktop and mobile devices
- **Modal Dialogs**: Clean forms for create/edit operations
- **Tables**: Sortable, scannable user list with inline actions
- **Badges**: Visual representation of role and permission assignments

### User Experience
- **Confirmation Dialogs**: Prevent accidental deletion
- **Error Handling**: Clear error messages for failed operations
- **Loading States**: Visual feedback during API calls
- **Form Validation**: Required fields and email validation
- **Auto-refresh**: Lists update automatically after changes
- **Search/Filter**: Group permissions by category

## Security Considerations

### Built-in Protections
1. **Permission Checks**: All API endpoints require `roles.manage` or `users.manage` permissions
2. **Audit Logging**: All modifications are logged with actor ID and timestamp
3. **Password Hashing**: Passwords are hashed with bcrypt (salt rounds: 10)
4. **Self-delete Prevention**: Users cannot delete their own account
5. **ADMIN Role Protection**: Cannot delete the ADMIN role
6. **Session-based Auth**: Uses NextAuth for secure session management

### Best Practices
- ✅ Only authenticated admins can access RBAC UI
- ✅ All changes are audit-logged
- ✅ Follow principle of least privilege
- ✅ Review role assignments regularly
- ✅ Use strong passwords for users
- ✅ Monitor emergency override usage

## Testing the UI

### Prerequisites
1. Database must be seeded with `npm run db:seed`
2. Default admin credentials:
   - Email: `admin@example.com`
   - Password: `Admin123!`
   - (Change in production!)

### Quick Test Steps
1. Login as admin
2. Navigate to `/admin/rbac`
3. Create a new permission: `inventory.manage`
4. Create a new role: `Senior Doctor` with permissions
5. Create a new user and assign the custom role
6. Verify changes appear in the UI

## API Endpoints Reference

| Endpoint | Method | Purpose | Permission Required |
|----------|--------|---------|-------------------|
| `/api/admin/roles` | GET | List all roles | `roles.manage` |
| `/api/admin/roles` | POST | Create role | `roles.manage` |
| `/api/admin/roles/:id` | GET | Get role details | `roles.manage` |
| `/api/admin/roles/:id` | PUT | Update role | `roles.manage` |
| `/api/admin/roles/:id` | DELETE | Delete role | `roles.manage` |
| `/api/admin/users` | GET | List all users | `users.manage` |
| `/api/admin/users` | POST | Create user | `users.manage` |
| `/api/admin/users/:id` | GET | Get user details | `users.manage` |
| `/api/admin/users/:id` | PUT | Update user | `users.manage` |
| `/api/admin/users/:id` | DELETE | Delete user | `users.manage` |
| `/api/admin/permissions` | GET | List permissions | `roles.manage` |
| `/api/admin/permissions` | POST | Create permissions | `roles.manage` |

## Future Enhancements

Potential improvements to the RBAC UI:
- [ ] Audit logs viewer
- [ ] Emergency override management
- [ ] Bulk user import (CSV)
- [ ] Permission dependency graph visualization
- [ ] Role duplication from templates
- [ ] User search and filtering
- [ ] Export role/permission matrix
- [ ] Permission request approval workflow
- [ ] Activity timeline
- [ ] Advanced filtering and sorting

## Troubleshooting

### Permissions Not Appearing
**Problem**: New permissions don't show in the UI
**Solution**: The UI shows all permissions from the database. Create them via the Permissions tab first.

### Cannot Delete Role
**Problem**: Getting error "Role has assigned users"
**Solution**: Remove all users assigned to the role before deleting.

### User Creation Fails
**Problem**: Duplicate email error
**Solution**: Emails must be unique. Use a different email address.

### UI Not Loading
**Problem**: RBAC page shows loading indefinitely
**Solution**: Check that you have `roles.manage` or `users.manage` permissions. Update to the latest version.

## Support & Maintenance

For issues or feature requests:
1. Check the troubleshooting section above
2. Review the API response in browser DevTools
3. Check audit logs for recent changes
4. Contact the development team with error details

---

**Last Updated**: January 2026
**Status**: Production Ready
**Version**: 1.0.0
