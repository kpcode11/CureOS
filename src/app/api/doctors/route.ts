import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/doctors
 * Get list of all doctors
 *
 * RBAC: doctor.read OR referral.create (doctors can see other doctors for referrals)
 */
export async function GET(req: Request) {
  let sessionRes;

  try {
    // Try doctor.read first
    sessionRes = await requirePermission(req, "doctor.read");
  } catch (err) {
    try {
      // If doctor.read fails, try referral.create (for referral creation)
      sessionRes = await requirePermission(req, "referral.create");
    } catch (err2) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
      take: 200,
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("[GET /api/doctors] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
