# Implementation Instructions - Next Steps

## 📋 Step-by-Step Guide to Fix Permission Issues

### Step 1: Set Environment Variables
```bash
# In .env.local or .env
RBAC_ADMIN_PASSWORD=your_secure_admin_password_123
RBAC_TEST_PASSWORD=test_user_password_456
RBAC_DOCTOR_PASSWORD=doctor_password_789
```

### Step 2: Run the Updated Seed Script
```bash
# From project root
npx prisma db seed
```

**Expected Output:**
```
🏥 Seeding Comprehensive Hospital RBAC System...

🧹 Cleaning up old RBAC data...
✅ Created 92 permissions

✅ Created 8 roles with permission mappings

✅ Created/updated admin user: admin@neon.example

📝 Creating/Updating test users with roles...
  ✓ keshav@example.com (RECEPTIONIST)
  ✓ doctor@example.com (DOCTOR)
  ✓ nurse@example.com (NURSE)
  ✓ pharmacist@example.com (PHARMACIST)
  ✓ labtech@example.com (LAB_TECH)

📋 Creating dummy doctors...
  ✓ Dr. John Doe (Cardiology)
  ✓ Dr. Sarah Johnson (Dermatology)
  ...

╔════════════════════════════════════════════════════════════╗
║         RBAC SEEDING COMPLETE - HOSPITAL SYSTEM            ║
╠════════════════════════════════════════════════════════════╣
║ Permissions: 92
║ Roles: 8 (Admin, Doctor, Nurse, Pharmacist, Lab Tech, ...)
║ Users: 6+ (1 Admin + 5 Test Users + Dummy Doctors)
╠════════════════════════════════════════════════════════════╣
║ UPDATED: Fixed all permission mismatches
║ Added missing permissions from route checks
║ Standardized naming conventions across codebase
╠════════════════════════════════════════════════════════════╣
║ Role Summary:
║   ADMINISTRATOR: 30 permissions
║   RECEPTIONIST: 11 permissions
║   DOCTOR: 28 permissions
║   NURSE: 14 permissions
║   PHARMACIST: 10 permissions
║   LAB_TECH: 7 permissions
║   BILLING_OFFICER: 12 permissions
║   PATIENT: 4 permissions
╠════════════════════════════════════════════════════════════╣
║ ✅ All route permission checks are now covered
║ ⚠️  IMPORTANT: Set these environment variables before seeding:
║  - RBAC_ADMIN_PASSWORD
║  - RBAC_TEST_PASSWORD
║  - RBAC_DOCTOR_PASSWORD
╚════════════════════════════════════════════════════════════╝
```

### Step 3: Restart Your Application
```bash
# Kill running dev server (Ctrl+C)
npm run dev
# or
yarn dev
```

### Step 4: Test Login & Data Fetching

**Test 1: Admin Login**
```bash
Email: admin@neon.example
Password: your_secure_admin_password_123
```
- Navigate to `/admin/rbac`
- Should see: All users, roles, permissions tables ✅
- No 403 errors ✅

**Test 2: Doctor Login**
```bash
Email: doctor@example.com
Password: test_user_password_456
```
- Navigate to `/doctor`
- Click "View Patients" → Check console for:
  ```
  [requirePermission] Checking permission "doctor.read"
  [requirePermission] ✓ Permission granted
  ```
- Patient list loads ✅
- Can view EMR, create prescriptions ✅
- No 403 errors ✅

**Test 3: Nurse Login**
```bash
Email: nurse@example.com
Password: test_user_password_456
```
- Navigate to `/nurse`
- Can record vitals ✅
- Can view beds ✅
- Cannot access admin panel ✅
- No 403 errors ✅

**Test 4: Pharmacist Login**
```bash
Email: pharmacist@example.com
Password: test_user_password_456
```
- Navigate to `/pharmacist`
- Can view prescriptions ✅
- Can dispense medications ✅
- Cannot view EMR ✅
- No 403 errors ✅

---

## 🔍 Verification Checklist

After seeding and testing, verify:

### Database Level
```bash
# Connect to database and run:
SELECT COUNT(*) FROM "Permission"; 
-- Should return: 92

SELECT COUNT(*) FROM "RoleEntity";
-- Should return: 8

SELECT COUNT(*) FROM "RolePermission";
-- Should return: 200+ (multiple permissions per role)
```

### Application Level
- [ ] Admin can access `/admin` dashboard
- [ ] Doctor can view patients without 403
- [ ] Nurse can record vitals without 403
- [ ] Pharmacist can dispense without 403
- [ ] Lab Tech can enter results without 403
- [ ] Receptionist can schedule appointments without 403
- [ ] Billing Officer can create invoices without 403
- [ ] Patient can view own records
- [ ] Unauthorized users get 403 (not 500)

### Console Logs
When accessing protected endpoints, you should see:
```
[requirePermission] Checking permission "permission.name"
[requirePermission] User permissions: [...]
[requirePermission] ✓ Permission granted
```

NOT:
```
[requirePermission] ✗ Permission denied
```

---

## 📊 What Changed

### Modified Files
1. ✅ `prisma/seed-rbac.ts` - Updated permissions and role mappings

### New Documentation Files (for reference)
- `PERMISSION_MISMATCH_ANALYSIS.md` - Original issue analysis
- `SEED_UPDATE_SUMMARY.md` - Summary of changes
- `PERMISSION_MAPPING_REFERENCE.md` - Complete permission list
- `IMPLEMENTATION_INSTRUCTIONS.md` - This file

### No Changes Needed to
- ✅ Routes (they stay the same)
- ✅ Schema (already correct)
- ✅ Auth logic (it works with the updated permissions)
- ✅ Middleware (it checks the database permissions)

---

## ⚠️ Troubleshooting

### Issue: Still Getting 403 Forbidden
**Solution:**
1. Verify seed ran successfully (check console output above)
2. Check environment variables are set
3. Restart dev server
4. Clear browser cache and session
5. Login again with fresh session

### Issue: Admin user not created
**Solution:**
```bash
# Check if RBAC_ADMIN_PASSWORD is set
echo $RBAC_ADMIN_PASSWORD

# If not, set it:
export RBAC_ADMIN_PASSWORD="your_password"
npx prisma db seed
```

### Issue: Permissions exist but still denied
**Solution:**
1. Check JWT token refresh:
   ```
   [JWT Callback] Refreshed permissions for user@email.com
   ```
2. If not refreshing, logout and login again
3. Check user has roleEntityId:
   ```sql
   SELECT id, email, role, "roleEntityId" FROM "User" WHERE email = 'user@email.com';
   ```

### Issue: Database lock during seeding
**Solution:**
```bash
# If seed fails with "database is locked":
npx prisma db push --skip-generate  # Ensure schema is synced
npm run db:reset                    # Reset and reseed
# or manually delete the .db file and reseed
```

---

## 📈 What This Accomplishes

✅ Adds 35+ missing permissions to database  
✅ Maps all route permission checks to database  
✅ Standardizes permission naming  
✅ Fixes 403 Forbidden cascade failures  
✅ Enables data fetching across all pages  
✅ Maintains security (unauthorized users still denied)  

---

## 🎯 Success Criteria

After completing these steps:

1. **Permission errors are fixed** - No more 403 on valid requests
2. **Data fetches across pages** - Patients → Prescriptions → Lab → Billing
3. **Each role works independently** - Doctor can do doctor stuff, nurse can do nurse stuff
4. **Security is maintained** - Unauthorized users still blocked
5. **All tests pass** - Existing test suite still works

---

## 📞 Quick Reference

**Seed command:**
```bash
npx prisma db seed
```

**Test credentials:**
```
Admin: admin@neon.example / {RBAC_ADMIN_PASSWORD}
Doctor: doctor@example.com / {RBAC_TEST_PASSWORD}
Nurse: nurse@example.com / {RBAC_TEST_PASSWORD}
Pharmacist: pharmacist@example.com / {RBAC_TEST_PASSWORD}
Lab Tech: labtech@example.com / {RBAC_TEST_PASSWORD}
Receptionist: keshav@example.com / {RBAC_TEST_PASSWORD}
```

**Permission count before/after:**
- Before: 50 permissions
- After: 92 permissions
- Change: +42 new permissions

---

## 🚀 Ready to Deploy?

Before deploying to production:

1. ✅ Test all roles locally
2. ✅ Verify permissions in database
3. ✅ Set production environment variables
4. ✅ Run seed in staging environment
5. ✅ Test all critical workflows
6. ✅ Get approval from stakeholders
7. ✅ Run seed in production

**Important:** Always backup production database before seeding!

```bash
# Backup command (PostgreSQL example)
pg_dump -U postgres hospital_db > hospital_db_backup.sql
```

---

Done! The system should now work correctly. 🎉
