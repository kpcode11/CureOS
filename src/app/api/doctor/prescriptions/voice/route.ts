import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { transcribeAudio } from "@/lib/whisper";
import { parsePrescription } from "@/lib/prescriptionParser";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: NextRequest) {
  try {
    const sessionRes = await getSession(req);

    if (!sessionRes?.user?.id || sessionRes.user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const patientId = formData.get("patientId") as string;

    if (!audioFile || !patientId) {
      return NextResponse.json(
        { error: "Missing audio file or patientId" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "prescriptions"
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const audioPath = path.join(uploadDir, `${Date.now()}-${audioFile.name}`);
    const buffer = await audioFile.arrayBuffer();
    fs.writeFileSync(audioPath, Buffer.from(buffer));

    const transcription = await transcribeAudio(audioPath);
    const parsedData = await parsePrescription(transcription);

    const doctor = await prisma.doctor.findUnique({
      where: { userId: sessionRes.user.id },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId: doctor.id,
        medications: parsedData.medications,
        instructions: parsedData.additionalNotes,
        dispensed: false,
      },
    });

    fs.unlinkSync(audioPath);

    return NextResponse.json({
      success: true,
      prescription,
      transcription,
      parsed: parsedData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process prescription: ${error}` },
      { status: 500 }
    );
  }
}