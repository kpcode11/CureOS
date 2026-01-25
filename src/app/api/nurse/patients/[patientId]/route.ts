import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { patientId: string } },
) {
  try {
    await requirePermission(req, "patient.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { patientId } = await params;
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      bloodType: true,
      address: true,
      emergencyContact: true,
      email: true,
    },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(p);
}
