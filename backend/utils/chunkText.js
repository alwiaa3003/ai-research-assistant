/**
 * Splits long text into overlapping chunks suitable for embedding.
 * @param {string} text
 * @param {number} chunkSize - approx characters per chunk
 * @param {number} overlap - characters shared between consecutive chunks
 */
export const chunkText = (text, chunkSize = 1000, overlap = 150) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  return chunks.filter(Boolean);
};
