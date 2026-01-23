import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

// PATCH /api/receptionist/appointments/:id/status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "appointments.update");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 });
  }

  const before = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  const updated = await prisma.appointment.update({ where: { id: params.id }, data: { status: body.status } });

  await createAudit({ actorId, action: `receptionist.appointment.status.${body.status.toLowerCase()}`, resource: "Appointment", resourceId: params.id, before, after: updated, meta: { status: body.status } });

  return NextResponse.json(updated);
}
