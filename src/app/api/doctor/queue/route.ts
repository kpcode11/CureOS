import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor, writeAudit, getRequestIp } from "@/lib/doctorAuth";
import { AppointmentStatus } from "@prisma/client";

/**
 * Compute IST day window [start,end) as UTC instants.
 * This avoids "today" mismatch caused by server timezone.
 */
function getIstDayWindowUtc() {
  const IST_OFFSET_MIN = 330; // +05:30

  const nowUtc = new Date();

  // Convert "now" into IST wall-clock by shifting +330 min
  const nowIst = new Date(nowUtc.getTime() + IST_OFFSET_MIN * 60_000);

  // IST midnight (wall clock)
  const startIst = new Date(nowIst);
  startIst.setHours(0, 0, 0, 0);

  const endIst = new Date(startIst);
  endIst.setDate(endIst.getDate() + 1);

  // Convert IST instants back to UTC instants by shifting -330 min
  const startUtc = new Date(startIst.getTime() - IST_OFFSET_MIN * 60_000);
  const endUtc = new Date(endIst.getTime() - IST_OFFSET_MIN * 60_000);

  return { startUtc, endUtc, nowUtc, nowIst, startIst, endIst };
}

export async function GET(req: Request) {
  try {
    const { user, doctor } = await requireDoctor(req);

    const { startUtc, endUtc, nowUtc, nowIst, startIst, endIst } =
      getIstDayWindowUtc();

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        dateTime: { gte: startUtc, lt: endUtc },
        status: { in: [AppointmentStatus.SCHEDULED] },
      },
      orderBy: [{ dateTime: "asc" }],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
          },
        },
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "DOCTOR_QUEUE_VIEW",
      resource: "Appointment",
      meta: {
        count: appointments.length,

        // Useful for debugging timezone:
        nowUtc: nowUtc.toISOString(),
        nowIst: nowIst.toISOString(),
        startIst: startIst.toISOString(),
        endIst: endIst.toISOString(),
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
      },
      ip: getRequestIp(req),
    });

    return NextResponse.json({
      window: {
        nowUtc: nowUtc.toISOString(),
        nowIst: nowIst.toISOString(),
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
      },
      appointments,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
