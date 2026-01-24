import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const { stdout } = await execPromise(
      `whisper "${audioPath}" --model base --output_format txt --output_dir temp`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const txtFile = path.join("temp", path.basename(audioPath, path.extname(audioPath)) + ".txt");
    const transcription = fs.readFileSync(txtFile, "utf-8");
    fs.unlinkSync(txtFile);

    return transcription.trim();
  } catch (error) {
    throw new Error(`Transcription failed: ${error}`);
  }
}