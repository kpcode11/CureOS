import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PatientPDFData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  emrRecords: Array<{
    id: string;
    diagnosis: string;
    symptoms: string;
    vitals: any;
    notes: string;
    createdAt: string;
  }>;
  prescriptions: Array<{
    id: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    instructions: string;
    dispensed: boolean;
    createdAt: string;
  }>;
  appointments: Array<{
    id: string;
    dateTime: string;
    reason: string;
    status: string;
    notes: string;
  }>;
  labTests: Array<{
    id: string;
    testType: string;
    status: string;
    priority: string;
    results: any;
    createdAt: string;
  }>;
}

export function generatePatientEMRPDF(patient: PatientPDFData): jsPDF {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // Set colors
  const primaryColor = [41, 128, 185]; // Blue
  const headerColor = [230, 240, 250];
  const borderColor = [200, 200, 200];

  // Helper function to add a section
  const addSection = (title: string) => {
    pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(12);
    pdf.setFont('', 'bold');
    pdf.text(title, 12, yPosition + 6);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
  };

  // Helper function to check page break
  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - 10) {
      pdf.addPage();
      yPosition = 15;
    }
  };

  // Helper function to add key-value pair
  const addKeyValue = (key: string, value: string | number) => {
    pdf.setFontSize(10);
    pdf.setFont('', 'bold');
    pdf.text(`${key}:`, 12, yPosition);
    pdf.setFont('', 'normal');
    const wrappedText = pdf.splitTextToSize(String(value), pageWidth - 45);
    pdf.text(wrappedText, 60, yPosition);
    yPosition += wrappedText.length > 1 ? wrappedText.length * 5 + 2 : 7;
  };

  // HEADER - Patient Information
  addSection('PATIENT INFORMATION');
  checkPageBreak(30);

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  pdf.setFontSize(16);
  pdf.setFont('', 'bold');
  pdf.text(`${patient.firstName} ${patient.lastName}`, 12, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont('', 'normal');
  const basicInfo = `Age: ${age} | Gender: ${patient.gender} | Blood Type: ${patient.bloodType}`;
  pdf.text(basicInfo, 12, yPosition);
  yPosition += 7;

  addKeyValue('Phone', patient.phone);
  addKeyValue('Email', patient.email);
  addKeyValue('Address', patient.address);
  yPosition += 5;

  // EMR RECORDS SECTION
  if (patient.emrRecords.length > 0) {
    checkPageBreak(30);
    addSection('CLINICAL RECORDS (EMR)');

    patient.emrRecords.forEach((emr, index) => {
      checkPageBreak(25);

      pdf.setFontSize(11);
      pdf.setFont('', 'bold');
      pdf.text(`Record #${index + 1}: ${emr.diagnosis}`, 12, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont('', 'normal');
      pdf.text(`Date: ${new Date(emr.createdAt).toLocaleDateString()}`, 12, yPosition);
      yPosition += 5;

      addKeyValue('Diagnosis', emr.diagnosis);
      addKeyValue('Symptoms', emr.symptoms);

      if (emr.vitals && Object.keys(emr.vitals).length > 0) {
        const vitalsText = Object.entries(emr.vitals)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        addKeyValue('Vitals', vitalsText);
      }

      if (emr.notes) {
        addKeyValue('Clinical Notes', emr.notes);
      }

      yPosition += 3;
    });
  }

  // PRESCRIPTIONS SECTION
  if (patient.prescriptions.length > 0) {
    checkPageBreak(30);
    addSection('PRESCRIPTIONS');

    patient.prescriptions.forEach((rx, index) => {
      checkPageBreak(25);

      pdf.setFontSize(11);
      pdf.setFont('', 'bold');
      pdf.text(`Prescription #${index + 1}`, 12, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont('', 'normal');
      pdf.text(`Date: ${new Date(rx.createdAt).toLocaleDateString()}`, 12, yPosition);
      yPosition += 4;

      pdf.setFont('', 'bold');
      pdf.text('Status: ', 12, yPosition);
      pdf.setFont('', 'normal');
      pdf.text(rx.dispensed ? 'Dispensed' : 'Pending', 45, yPosition);
      yPosition += 6;

      // Medications table
      pdf.setFontSize(9);
      pdf.setFont('', 'bold');
      pdf.text('Medications:', 12, yPosition);
      yPosition += 4;

      rx.medications.forEach((med) => {
        pdf.setFont('', 'normal');
        const medLine = `• ${med.name} ${med.dosage} - ${med.frequency}`;
        const wrapped = pdf.splitTextToSize(medLine, pageWidth - 30);
        pdf.text(wrapped, 15, yPosition);
        yPosition += wrapped.length * 4 + 1;
      });

      yPosition += 2;
      addKeyValue('Instructions', rx.instructions);
      yPosition += 3;
    });
  }

  // LAB TESTS SECTION
  if (patient.labTests.length > 0) {
    checkPageBreak(30);
    addSection('LABORATORY TESTS');

    patient.labTests.forEach((lab, index) => {
      checkPageBreak(25);

      pdf.setFontSize(11);
      pdf.setFont('', 'bold');
      pdf.text(`Lab Test #${index + 1}: ${lab.testType}`, 12, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont('', 'normal');
      pdf.text(`Date: ${new Date(lab.createdAt).toLocaleDateString()}`, 12, yPosition);
      yPosition += 5;

      addKeyValue('Status', lab.status);
      addKeyValue('Priority', lab.priority);

      if (lab.results && Object.keys(lab.results).length > 0) {
        pdf.setFont('', 'bold');
        pdf.text('Test Results:', 12, yPosition);
        yPosition += 5;

        Object.entries(lab.results).forEach(([key, value]) => {
          pdf.setFont('', 'normal');
          const resultLine = `${key}: ${value}`;
          const wrapped = pdf.splitTextToSize(resultLine, pageWidth - 30);
          pdf.text(wrapped, 15, yPosition);
          yPosition += wrapped.length * 4 + 1;
        });
      }

      yPosition += 3;
    });
  }

  // APPOINTMENTS SECTION
  if (patient.appointments.length > 0) {
    checkPageBreak(30);
    addSection('APPOINTMENT HISTORY');

    patient.appointments.forEach((apt, index) => {
      checkPageBreak(20);

      pdf.setFontSize(10);
      pdf.setFont('', 'bold');
      pdf.text(`Appointment #${index + 1}`, 12, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont('', 'normal');

      addKeyValue('Date & Time', new Date(apt.dateTime).toLocaleString());
      addKeyValue('Reason', apt.reason);
      addKeyValue('Status', apt.status);

      if (apt.notes) {
        addKeyValue('Notes', apt.notes);
      }

      yPosition += 3;
    });
  }

  // FOOTER
  checkPageBreak(10);
  yPosition = pageHeight - 10;
  pdf.setFontSize(8);
  pdf.setFont('', 'normal');
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Generated on ${new Date().toLocaleString()} | CureOS EMR System`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  return pdf;
}

/**
 * Download PDF to client
 */
export function downloadPatientEMRPDF(patient: PatientPDFData): void {
  try {
    const pdf = generatePatientEMRPDF(patient);
    const fileName = `EMR_${patient.lastName}_${patient.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
