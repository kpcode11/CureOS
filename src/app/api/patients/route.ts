import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "patient.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const patients = await prisma.patient.findMany({ take: 200 });
  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "patient.create");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    console.error('Permission denied for patient.create:', err);
    return NextResponse.json({ error: "Forbidden - insufficient permissions" }, { status: 403 });
  }
  const body = await req.json();

  // Validate required fields
  if (
    !body.firstName ||
    !body.lastName ||
    !body.phone ||
    !body.gender ||
    !body.dateOfBirth
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: firstName, lastName, phone, gender, dateOfBirth",
      },
      { status: 400 },
    );
  }

  // Additional validation
  const phoneRegex = /^[0-9+\s\-()]{10,}$/;
  if (!phoneRegex.test(body.phone)) {
    return NextResponse.json(
      {
        error: "Invalid phone number format",
      },
      { status: 400 },
    );
  }

  // Validate email if provided
  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }
  }

  // Validate emergency contact if provided
  if (body.emergencyContact) {
    if (!phoneRegex.test(body.emergencyContact)) {
      return NextResponse.json(
        {
          error: "Invalid emergency contact number format",
        },
        { status: 400 },
      );
    }
  }

  // Validate date of birth
  const dob = new Date(body.dateOfBirth);
  const today = new Date();
  if (dob > today) {
    return NextResponse.json(
      {
        error: "Date of birth cannot be in the future",
      },
      { status: 400 },
    );
  }

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  if (age < 0 || age > 150) {
    return NextResponse.json(
      {
        error: "Please provide a valid date of birth",
      },
      { status: 400 },
    );
  }

  try {
    const rec = await prisma.patient.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email ? body.email.trim() : null,
        phone: body.phone.trim(),
        dateOfBirth: dob,
        gender: body.gender.toUpperCase(),
        address: body.address ? body.address.trim() : null,
        bloodType: body.bloodType || null,
        emergencyContact: body.emergencyContact ? body.emergencyContact.trim() : null,
      },
    });

    // Create registration fee billing record
    const registrationFee = 500; // ₹500 registration fee
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    await prisma.billing.create({
      data: {
        patientId: rec.id,
        amount: registrationFee,
        description: 'Patient Registration Fee',
        status: 'PENDING',
        dueDate: dueDate,
      },
    });

    await createAudit({
      actorId,
      action: "patient.create",
      resource: "Patient",
      resourceId: rec.id,
      meta: { firstName: rec.firstName, lastName: rec.lastName, registrationFee },
    });

    return NextResponse.json(rec);
  } catch (dbError: any) {
    console.error("Database error:", dbError);
    return NextResponse.json(
      {
        error: "Failed to create patient record. Please try again.",
      },
      { status: 500 },
    );
  }
}
