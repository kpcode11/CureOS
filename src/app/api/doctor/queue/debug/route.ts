import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/doctorAuth";

export async function GET(req: Request) {
  try {
    const { doctor } = await requireDoctor(req);

    // last 7 days window (covers timezone issues)
    const from = new Date();
    from.setDate(from.getDate() - 7);

    const appts = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        dateTime: { gte: from },
      },
      orderBy: { dateTime: "desc" },
      take: 20,
      select: {
        id: true,
        dateTime: true,
        status: true,
        reason: true,
        patientId: true,
      },
    });

    return NextResponse.json({
      doctorId: doctor.id,
      now: new Date().toISOString(),
      from: from.toISOString(),
      count: appts.length,
      appointments: appts,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
