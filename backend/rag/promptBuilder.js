/**
 * Formats retrieved chunks into a numbered, citable context block.
 * Each chunk is labeled with its source (filename + page number) so
 * Gemini can literally see where each piece of information came from
 * and cite it back in the answer.
 *
 * Returns a clear "no context" marker if no chunks were retrieved,
 * rather than an empty string - this gives the model something
 * concrete to react to when nothing relevant was found.
 */
const formatContext = (retrievedChunks) => {
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return "No relevant context was found in the provided documents.";
  }

  return retrievedChunks
    .map((chunk, index) => {
      const fileName = chunk.metadata?.fileName || "Unknown document";
      const pageNumber = chunk.metadata?.pageNumber;
      const sourceLabel = pageNumber
        ? `Source: ${fileName}, page ${pageNumber}`
        : `Source: ${fileName}`;

      const scoreText =
        typeof chunk.score === "number"
            ? ` (relevance: ${(chunk.score * 100).toFixed(1)}%)`
            : "";

    return `[${index + 1}] ${sourceLabel}${scoreText}\n${chunk.text.trim()}`;
    })
    .join("\n\n");
};

/**
 * Formats prior conversation turns into a plain transcript. Kept as
 * its own clearly-labeled section in the final prompt, separate from
 * the document context, so the model never confuses something said
 * earlier in the chat with actual evidence from the documents.
 */
const formatConversationHistory = (previousMessages) => {
  if (!previousMessages || previousMessages.length === 0) {
    return "No previous conversation.";
  }

  return previousMessages
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");
};

/**
 * Holds the fixed rules Gemini must follow, in one place so the
 * wording only ever needs to be tuned in a single spot.
 */
const buildSystemInstructions = () => {
  return `You are a professional AI research assistant for stock market analysis.

Rules you must follow:
- Answer ONLY using the information provided in the "Document Context" section below.
- Do not use outside knowledge, assumptions, or guesses. Never hallucinate facts, figures, or names.
- If the answer is not present in the Document Context, respond with exactly this sentence and nothing else:
  "I don't have enough information in the provided documents to answer that."
- When you do answer, cite the source of each fact using the filename and page number shown in the context (e.g. "according to TCS_Q4_2026.pdf, page 3").
- The "Previous Conversation" section is for conversational continuity only (e.g. understanding follow-up questions). It is NOT evidence and must never be treated as a factual source.
- Keep answers concise, professional, and written in the tone of a financial analyst. Do not give direct buy/sell/hold investment advice - present facts and let the user draw their own conclusions.`;
};

/**
 * Builds the final structured prompt string sent to Gemini.
 *
 * Sections are assembled in a fixed order and clearly separated with
 * headers, so the model can distinguish instructions, factual
 * evidence, conversational context, and the actual question:
 * System Instructions -> Document Context -> Previous Conversation -> User Question.
 *
 * @param {{
 *   userQuestion: string,
 *   retrievedChunks: Array<{ text: string, metadata: object, score: number|null }>,
 *   previousMessages?: Array<{ role: "user"|"assistant", content: string }>
 * }} params
 * @returns {string}
 */
export const buildPrompt = ({ userQuestion, retrievedChunks, previousMessages = [] }) => {
  if (!userQuestion || !userQuestion.trim()) {
    if (typeof userQuestion !== "string" || !userQuestion.trim()) {
        throw new TypeError("buildPrompt requires a non-empty userQuestion.");
    }
  }

  const systemInstructions = buildSystemInstructions();
  const contextBlock = formatContext(retrievedChunks);
  const historyBlock = formatConversationHistory(previousMessages);

  return `${systemInstructions}

--- Document Context ---
${contextBlock}

--- Previous Conversation (context only, not evidence) ---
${historyBlock}

--- User Question ---
${userQuestion.trim()}`;
};