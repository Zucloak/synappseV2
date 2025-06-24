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
  // Ensure the request method is POST. This proxy only accepts POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed', success: false });
  }

  // Extract the 'message' from the request body.
  // The client-side Mobius code sends the user's message in this format.
  const { message } = req.body;

  // Basic validation: Check if a message was provided.
  if (!message) {
    return res.status(400).json({ message: 'Message content is required.', success: false });
  }

  // Access the Gemini API key from Vercel's environment variables.
  // This variable must be set in your Vercel project settings.
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Define the Gemini model ID. This can also be passed from the client if dynamic models are needed.
  const GEMINI_MODEL_ID = "gemini-2.0-flash"; // Using gemini-2.0-flash as per the client-side code

  // Check if the API key is configured. If not, it's a server configuration error.
  if (!GEMINI_API_KEY) {
    console.error("Serverless Function Error: GEMINI_API_KEY environment variable is not set on Vercel.");
    return res.status(500).json({ message: 'Server configuration error: Gemini API Key not found. Please ensure GEMINI_API_KEY is set in Vercel environment variables.', success: false });
  }

  try {
    // Construct the chat history payload for the Gemini API.
    // The Gemini API expects an array of content, where each item has a role and parts.
    const chatHistory = [{ role: "user", parts: [{ text: message }] }];
    const payload = { contents: chatHistory };

    // Construct the full API URL for the Gemini API endpoint.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

    // Make the fetch request to the actual Gemini API.
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Parse the JSON response from the Gemini API.
    const geminiResult = await geminiResponse.json();

    // Log the full Gemini API response for debugging purposes if it's not 'ok'.
    if (!geminiResponse.ok) {
        console.error("Serverless Function: Gemini API returned a non-OK status. Status:", geminiResponse.status, "Response:", JSON.stringify(geminiResult));
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
