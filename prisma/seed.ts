import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();


async function main() {
  const email = "doctor@cureos.com";
  const password = "Doctor@123";

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create User with DOCTOR role
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "DOCTOR",
      password: hashedPassword,
      name: "Dr Cureos",
    },
    create: {
      email,
      password: hashedPassword,
      name: "Dr Cureos",
      role: "DOCTOR",
    },
  });

  // 2. Create Doctor profile
  const doctor = await prisma.doctor.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      specialization: "General Physician",
      licenseNumber: "DOC-001",
    },
  });

  // 3. Create Patient
  const patient = await prisma.patient.create({
    data: {
      firstName: "Rahul",
      lastName: "Sharma",
      phone: "9876543210",
      gender: "M",
      dateOfBirth: new Date("2000-01-01"),
      address: "Mumbai",
    },
  });

  // 4. Create Appointment for today
    const appointment = await prisma.appointment.create({
    data: {
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: new Date(),
        reason: "Fever",
        status: "SCHEDULED",
        // tokenNo removed because DB doesn't have it
    },
    });


  console.log("✅ Seed completed");
  console.log("Doctor login:");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Appointment ID:", appointment.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
