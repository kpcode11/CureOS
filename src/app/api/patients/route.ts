import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "patients.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const patients = await prisma.patient.findMany({ take: 200 });
  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "patients.create");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const rec = await prisma.patient.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      address: body.address || null,
      bloodType: body.bloodType || null,
      emergencyContact: body.emergencyContact || null,
    },
  });

  await createAudit({
    actorId,
    action: "patient.create",
    resource: "Patient",
    resourceId: rec.id,
    meta: { firstName: rec.firstName, lastName: rec.lastName },
  });

  return NextResponse.json(rec);
}
