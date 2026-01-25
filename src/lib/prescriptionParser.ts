function parseWithRegex(text: string): {
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string }>;
  additionalNotes: string;
} {
  const lines = text.split("\n");
  const medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }> = [];

  lines.forEach((line) => {
    const match = line.match(
      /(.+?),\s*(\d+\s*(?:mg|ml|g)),\s*(\d+\s*times|once|twice|thrice),\s*for\s*(\d+\s*days?)/i
    );
    if (match) {
      medications.push({
        name: match[1].trim(),
        dosage: match[2].trim(),
        frequency: match[3].trim(),
        duration: match[4].trim(),
        instructions: "",
      });
    }
  });

  return {
    medications,
    additionalNotes: text,
  };
}

export async function parsePrescription(transcription: string): Promise<{
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string }>;
  additionalNotes: string;
}> {
  return parseWithRegex(transcription);
}