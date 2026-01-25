import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission(req, "billing.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const rec = await prisma.billing.findUnique({
      where: { id },
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
    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Format patient data to match frontend expectations
    const formattedRec = {
      ...rec,
      patient: rec.patient
        ? {
            name: `${rec.patient.firstName} ${rec.patient.lastName}`,
            mrn: rec.patient.id,
            email: rec.patient.email,
            phone: rec.patient.phone,
          }
        : undefined,
    };

    return NextResponse.json(formattedRec);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("billing.[id].GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
