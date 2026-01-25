import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

// GET all insurance policies
export async function GET(req: Request) {
  try {
    await requirePermission(req, "insurance.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const patientId = url.searchParams.get("patientId");

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const policies = await prisma.insurancePolicy.findMany({
      where,
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
        claims: {
          select: {
            id: true,
            claimNumber: true,
            status: true,
            claimAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(policies);
  } catch (err) {
    console.error("Insurance policies GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST create new insurance policy
export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "insurance.create");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      patientId,
      provider,
      policyNumber,
      policyType,
      coverageAmount,
      startDate,
      endDate,
    } = body;

    // Validation
    if (
      !patientId ||
      !provider ||
      !policyNumber ||
      !policyType ||
      !coverageAmount ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if policy number already exists
    const existing = await prisma.insurancePolicy.findUnique({
      where: { policyNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Policy number already exists" },
        { status: 409 },
      );
    }

    const policy = await prisma.insurancePolicy.create({
      data: {
        patientId,
        provider,
        policyNumber,
        policyType,
        coverageAmount: parseFloat(coverageAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "ACTIVE",
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAudit({
      actorId,
      action: "insurance.policy.create",
      resource: "InsurancePolicy",
      resourceId: policy.id,
      meta: {
        policyNumber: policy.policyNumber,
        provider: policy.provider,
        patientName: `${policy.patient.firstName} ${policy.patient.lastName}`,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (err) {
    console.error("Insurance policy POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
