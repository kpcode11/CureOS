import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, "patients.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rec = await prisma.patient.findUnique({ where: { id: params.id } });
  if (!rec) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "patients.update");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "emergencyContact",
    "bloodType",
    "dateOfBirth",
    "gender",
  ];
  const data: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined) {
      data[k] = k === "dateOfBirth" ? new Date(body[k]) : body[k];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const before = await prisma.patient.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const updated = await prisma.patient.update({ where: { id: params.id }, data });

  await createAudit({
    actorId,
    action: "receptionist.patient.update",
    resource: "Patient",
    resourceId: params.id,
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}
