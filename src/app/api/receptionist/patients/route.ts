import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

// POST /api/receptionist/patients
// GET  /api/receptionist/patients
export async function GET(req: Request) {
  try {
    await requirePermission(req, "patients.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);
  const skip = Number(url.searchParams.get("skip") ?? 0);
  const q = url.searchParams.get("q") ?? undefined;

  const where: any = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [rows, count] = await Promise.all([
    prisma.patient.findMany({ where, take, skip, orderBy: { createdAt: "desc" } }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ rows, count });
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
  if (!body.firstName || !body.lastName || !body.phone || !body.gender || !body.dateOfBirth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const patient = await prisma.patient.create({
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
    action: "receptionist.patient.create",
    resource: "Patient",
    resourceId: patient.id,
    meta: { firstName: patient.firstName, lastName: patient.lastName },
  });

  return NextResponse.json(patient);
}
