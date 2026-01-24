import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createAudit } from '@/services/audit.service';

/**
 * POST /api/admin/profiles
 * Create a role-specific profile for a user
 * 
 * RBAC: admin.users.create
 * Body: {
 *   userId: string;
 *   role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECH' | 'RECEPTIONIST';
 *   specialization?: string; (DOCTOR only)
 *   licenseNumber?: string; (DOCTOR, NURSE, PHARMACIST)
 *   department?: string; (NURSE, LAB_TECH)
 * }
 * 
 * Returns: The created profile object
 * 
 * Edge cases handled:
 * - User not found (404)
 * - Profile already exists (409)
 * - Missing required fields for role (400)
 * - Invalid role (400)
 * - Duplicate license number (409)
 */
export async function POST(req: Request) {
  try {
    await requirePermission(req, 'admin.users.create');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, role, specialization, licenseNumber, department } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH', 'RECEPTIONIST'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle role-specific profile creation
    let profile: any = null;

    switch (role) {
      case 'DOCTOR': {
        // Validate required fields for DOCTOR
        if (!specialization || !specialization.trim()) {
          return NextResponse.json({ error: 'specialization is required for DOCTOR' }, { status: 400 });
        }
        if (!licenseNumber || !licenseNumber.trim()) {
          return NextResponse.json({ error: 'licenseNumber is required for DOCTOR' }, { status: 400 });
        }

        // Check if license number already exists
        const existingDoctor = await prisma.doctor.findUnique({
          where: { licenseNumber: licenseNumber.trim() }
        });

        if (existingDoctor) {
          return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
        }

        // Check if doctor profile already exists for this user
        const existingProfile = await prisma.doctor.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          return NextResponse.json({ error: 'Doctor profile already exists for this user' }, { status: 409 });
        }

        profile = await prisma.doctor.create({
          data: {
            userId,
            specialization: specialization.trim(),
            licenseNumber: licenseNumber.trim()
          }
        });
        break;
      }

      case 'NURSE': {
        // Validate required fields for NURSE
        if (!licenseNumber || !licenseNumber.trim()) {
          return NextResponse.json({ error: 'licenseNumber is required for NURSE' }, { status: 400 });
        }
        if (!department || !department.trim()) {
          return NextResponse.json({ error: 'department is required for NURSE' }, { status: 400 });
        }

        // Check if license number already exists
        const existingNurse = await prisma.nurse.findUnique({
          where: { licenseNumber: licenseNumber.trim() }
        });

        if (existingNurse) {
          return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
        }

        // Check if nurse profile already exists
        const existingProfile = await prisma.nurse.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          return NextResponse.json({ error: 'Nurse profile already exists for this user' }, { status: 409 });
        }

        profile = await prisma.nurse.create({
          data: {
            userId,
            licenseNumber: licenseNumber.trim(),
            department: department.trim()
          }
        });
        break;
      }

      case 'PHARMACIST': {
        // Validate required fields for PHARMACIST
        if (!licenseNumber || !licenseNumber.trim()) {
          return NextResponse.json({ error: 'licenseNumber is required for PHARMACIST' }, { status: 400 });
        }

        // Check if license number already exists
        const existingPharmacist = await prisma.pharmacist.findUnique({
          where: { licenseNumber: licenseNumber.trim() }
        });

        if (existingPharmacist) {
          return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
        }

        // Check if pharmacist profile already exists
        const existingProfile = await prisma.pharmacist.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          return NextResponse.json({ error: 'Pharmacist profile already exists for this user' }, { status: 409 });
        }

        profile = await prisma.pharmacist.create({
          data: {
            userId,
            licenseNumber: licenseNumber.trim()
          }
        });
        break;
      }

      case 'LAB_TECH': {
        // Validate required fields for LAB_TECH
        if (!department || !department.trim()) {
          return NextResponse.json({ error: 'department is required for LAB_TECH' }, { status: 400 });
        }

        // Check if lab tech profile already exists
        const existingProfile = await prisma.labTech.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          return NextResponse.json({ error: 'Lab Tech profile already exists for this user' }, { status: 409 });
        }

        profile = await prisma.labTech.create({
          data: {
            userId,
            department: department.trim()
          }
        });
        break;
      }

      case 'RECEPTIONIST': {
        // Check if receptionist profile already exists
        const existingProfile = await prisma.receptionist.findUnique({
          where: { userId }
        });

        if (existingProfile) {
          return NextResponse.json({ error: 'Receptionist profile already exists for this user' }, { status: 409 });
        }

        profile = await prisma.receptionist.create({
          data: {
            userId
          }
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create audit log
    await createAudit({
      actorId: null,
      action: 'profile.create',
      resource: `${role}_Profile`,
      resourceId: profile.id,
      meta: { userId, role, email: user.email }
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error('[Admin POST /profiles] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
