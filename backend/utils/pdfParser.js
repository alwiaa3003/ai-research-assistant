import fs from "fs";
// npm install pdf-parse
import pdf from "pdf-parse";

/**
 * Extracts raw text from a PDF file on disk.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};
