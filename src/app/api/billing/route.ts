import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request) {
  // explicit permission check -> 403 on failure
  try {
    await requirePermission(req, "billing.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // DB operations separated so unexpected errors return 500
  try {
    const url = new URL(req.url);
    const patientId = url.searchParams.get("patientId");
    const status = url.searchParams.get("status");
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const rows = await prisma.billing.findMany({
      where,
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Format patient data to match frontend expectations
    const formattedRows = rows.map((row) => ({
      ...row,
      patient: row.patient
        ? {
            name: `${row.patient.firstName} ${row.patient.lastName}`,
            mrn: row.patient.id,
          }
        : undefined,
    }));

    return NextResponse.json(formattedRows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("billing.GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // permission check
  try {
    await requirePermission(req, "billing.create");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body.patientId !== "string")
      return NextResponse.json(
        { error: "patientId required" },
        { status: 400 },
      );
    if (typeof body.amount !== "number" || Number.isNaN(body.amount))
      return NextResponse.json({ error: "invalid amount" }, { status: 400 });

    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date();
    if (Number.isNaN(dueDate.getTime()))
      return NextResponse.json({ error: "invalid dueDate" }, { status: 400 });

    const rec = await prisma.billing.create({
      data: {
        patientId: body.patientId,
        amount: body.amount,
        description: body.description ?? "",
        dueDate,
      },
    });

    // best-effort audit — do not fail the request if audit fails
    try {
      const actorId = (req as any).__session?.user?.id ?? null;
      await createAudit({
        actorId,
        action: "billing.create",
        resource: "Billing",
        resourceId: rec.id,
        meta: { amount: rec.amount, patientId: rec.patientId },
      });
    } catch (auditErr) {
      // eslint-disable-next-line no-console
      console.warn("billing.POST audit failed:", auditErr);
    }

    return NextResponse.json(rec);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("billing.POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
