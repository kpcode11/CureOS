# RBAC UI - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Ensure Database is Seeded
```bash
npm run prisma:seed
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Login as Admin
- URL: `http://localhost:3000/login`
- Email: `admin@example.com`
- Password: `Admin123!`

### Step 4: Navigate to RBAC
- Click "Admin" in the navigation
- Click "Role-Based Access Control" card
- Or directly visit: `http://localhost:3000/admin/rbac`

---

## 📖 Understanding the Tabs

### **Overview Tab**
Educational content about RBAC. Best for:
- New administrators learning the system
- Understanding roles vs. permissions
- Viewing best practices

### **Roles Tab** 🔐
Manage role definitions. Here you can:
- View all roles (system and custom)
- Create new roles
- Edit existing roles
- Assign permissions to roles
- Delete custom roles

**Example**: Create a "Senior Doctor" role with permissions for patient management and prescriptions.

### **Users Tab** 👥
Manage system users. Here you can:
- View all users in a table
- Create new users
- Assign roles to users
- Edit user information
- Reset user passwords
- Delete users

**Example**: Create "john.doe@hospital.com" as a Doctor.

### **Permissions Tab** 🔒
Manage individual permissions. Here you can:
- View all permissions grouped by category
- Create new permissions
- See permissions organized by resource type

**Example**: Create "inventory.manage" permission for inventory staff.

---

## 🎯 Common Tasks

### Task 1: Create a Custom Role
1. Go to **Roles** tab
2. Click **"New Role"** button
3. Enter role name (e.g., "Clinical Supervisor")
4. Check permissions to assign
5. Click **"Create Role"**

### Task 2: Create a New User
1. Go to **Users** tab
2. Click **"New User"** button
3. Fill in:
   - Name: John Doe
   - Email: john.doe@hospital.com
   - Password: Strong password
   - Role: Select from dropdown
4. Click **"Create User"**
5. User can now login with these credentials

### Task 3: Change User's Role
1. Go to **Users** tab
2. Find the user in the table
3. Click **"Edit"** button
4. Select new role from dropdown
5. Click **"Update User"**

### Task 4: Add New Permission
1. Go to **Permissions** tab
2. Click **"New Permission"** button
3. Enter permission names (one per line):
   ```
   inventory.create
   inventory.read
   inventory.update
   inventory.delete
   ```
4. Click **"Create Permissions"**
5. Permissions now available for role assignment

### Task 5: Update Role Permissions
1. Go to **Roles** tab
2. Find the role you want to update
3. Click **"Edit"** button
4. Check/uncheck permissions as needed
5. Click **"Update Role"**

---

## 📊 System Roles Explained

| Role | Best For | Key Permissions |
|------|----------|-----------------|
| ADMIN | System administrators | All permissions |
| DOCTOR | Doctors, specialists | View patients, create prescriptions |
| NURSE | Nurses, nursing staff | View/update patients |
| PHARMACIST | Pharmacy staff | Read prescriptions, dispense medications |
| LAB_TECH | Lab technicians | Lab operations, tests |
| RECEPTIONIST | Front desk, scheduling | Create patients, manage appointments |
| EMERGENCY | Emergency personnel | Emergency override requests |

---

## ⚠️ Important Rules

### ✅ Do's
- ✅ Create custom roles for specific needs
- ✅ Use the naming convention: `resource.action` for permissions
- ✅ Review role assignments regularly
- ✅ Keep ADMIN role restricted to administrators only
- ✅ Use strong passwords (12+ characters, mix of letters/numbers/symbols)

### ❌ Don'ts
- ❌ Don't delete the ADMIN role
- ❌ Don't assign unnecessary permissions to users
- ❌ Don't use weak passwords
- ❌ Don't share admin credentials
- ❌ Don't delete users that have active tasks

---

## 🔑 Permission Naming Guide

Follow this pattern: `resource.action`

**Examples:**
```
patients.create      - Create patient records
patients.read        - View patient records
patients.update      - Update patient information
patients.delete      - Delete patient records
prescriptions.create - Create prescriptions
prescriptions.read   - View prescriptions
prescriptions.dispense - Dispense medications
emergency.request    - Request emergency access
audit.read           - View audit logs
roles.manage         - Manage roles and permissions
users.manage         - Manage users
```

---

## 🔍 Troubleshooting

### Issue: Can't access RBAC page
**Solution**: 
- Confirm you're logged in as admin
- Check that you have `roles.manage` permission
- Look in browser console for error details

### Issue: Can't create users
**Solution**:
- Check if you have `users.manage` permission
- Ensure email is unique (not used by another user)
- Verify password meets requirements

### Issue: Changes not appearing
**Solution**:
- Refresh the page (F5)
- Check for error messages in red boxes
- Try the action again

### Issue: Can't delete a role
**Solution**:
- Check if the role has assigned users
- Can't delete system roles (ADMIN, DOCTOR, etc.)
- Remove all users from the role first, then delete

---

## 📱 Mobile Access

The RBAC UI is fully responsive:
- Works on desktop computers
- Works on tablets
- Works on mobile phones (with some limitations)

For best experience, use a desktop browser.

---

## 🎓 Learn More

For detailed information, see:
- `RBAC_UI_DOCUMENTATION.md` - Complete feature guide
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `/admin/rbac` - Overview tab in the app

---

## 💬 Need Help?

1. **Within the App**: Read the Overview tab in RBAC dashboard
2. **Documentation**: Check `RBAC_UI_DOCUMENTATION.md`
3. **Browser Console**: Open DevTools (F12) to see error details
4. **API Endpoints**: Test directly at `/api/admin/roles` to debug

---

## ✅ Checklist: Your First RBAC Setup

- [ ] Database seeded with `npm run prisma:seed`
- [ ] Dev server running with `npm run dev`
- [ ] Logged in as admin@example.com
- [ ] Navigated to /admin/rbac
- [ ] Created a custom permission
- [ ] Created a custom role with permissions
- [ ] Created a test user with the custom role
- [ ] Verified user can login
- [ ] Reviewed audit logs (if available)
- [ ] Read the documentation

---

**Need to reset?** Contact your development team to re-seed the database.

Happy administrating! 🎉
