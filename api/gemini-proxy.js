// api/gemini-proxy.js

// Using native fetch API which is available in Vercel's Node.js runtime.
// No explicit import of 'node-fetch' is needed, simplifying dependencies.

/**
 * Vercel Serverless Function to proxy requests to the Gemini API.
 * This function securely accesses the GEMINI_API_KEY from Vercel environment variables.
 *
 * @param {import('@vercel/node').VercelRequest} req - The incoming Vercel request object.
 * @param {import('@vercel/node').VercelResponse} res - The Vercel response object.
 */
export default async function handler(req, res) {
  // Ensure the request method is POST.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed', success: false });
  }

  // Extract the 'chatHistory' array from the request body.
  // The client-side Mobius code now sends the entire conversation history in this format.
  const { chatHistory } = req.body;

  // Basic validation: Check if chatHistory was provided.
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return res.status(400).json({ message: 'Chat history (contents) is required.', success: false });
  }

  // Access the Gemini API key from Vercel's environment variables.
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Define the Gemini model ID.
  const GEMINI_MODEL_ID = 'gemini-2.0-flash'; // Or 'gemini-pro' if preferred

  try {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the entire chatHistory directly as 'contents' to the Gemini API
      body: JSON.stringify({ contents: chatHistory }),
    });

    const geminiResult = await geminiResponse.json();

    // Check for API errors (e.g., invalid key, rate limits)
    if (!geminiResponse.ok) {
        console.error("Serverless Function: Error from Gemini API:", JSON.stringify(geminiResult));
        return res.status(geminiResponse.status).json({
            message: "Error from Gemini API.",
            success: false,
            details: geminiResult // Include Gemini's error response for client debugging
        });
    }

    // Check if the Gemini API call was successful and returned valid candidates.
    if (geminiResult.candidates && geminiResult.candidates.length > 0 &&
        geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts &&
        geminiResult.candidates[0].content.parts.length > 0) {
      // Extract the generated text from the Gemini response.
      const generatedText = geminiResult.candidates[0].content.parts[0].text;
      // Send the generated text back to the client.
      return res.status(200).json({ text: generatedText, success: true });
    } else {
      // Log unexpected response structure or errors from the Gemini API.
      console.warn("Serverless Function: Gemini API returned a successful status (OK) but an unexpected response structure:", JSON.stringify(geminiResult));
      return res.status(502).json({ message: "Failed to get a valid response from Gemini AI. Unexpected response structure.", success: false, details: geminiResult });
    }
  } catch (error) {
    // Catch any network or other errors during the fetch operation.
    console.error("Serverless Function Error: Exception during Gemini API call:", error);
    return res.status(500).json({ message: `An internal server error occurred while contacting Gemini API: ${error.message}`, success: false });
  }
}
