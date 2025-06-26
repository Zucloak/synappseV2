// api/firebase-config-proxy.js

/**
 * Vercel Serverless Function to securely provide Firebase configuration.
 * This function reads Firebase config from Vercel environment variables,
 * preventing them from being exposed on the client-side.
 *
 * @param {import('@vercel/node').VercelRequest} req - The incoming Vercel request object.
 * @param {import('@vercel/node').VercelResponse} res - The Vercel response object.
 */
export default function handler(req, res) {
  // This endpoint should only respond to GET requests.
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Construct the Firebase config object from environment variables.
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Validate that all necessary environment variables are present.
    const missingKeys = Object.entries(firebaseConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      console.error(`Serverless Function Error: Missing Firebase environment variables on Vercel: ${missingKeys.join(', ')}`);
      // Return a server error response if the configuration is incomplete.
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: The Firebase configuration is incomplete. Please ensure all required environment variables are set in Vercel.',
        missingKeys: missingKeys,
      });
    }

    // Set caching headers to reduce redundant calls and improve performance.
    // The config is static, so it can be cached for a long time.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate'); // Cache for 24 hours
    
    // Send the complete and valid config object as a JSON response.
    return res.status(200).json(firebaseConfig);

  } catch (error) {
    // Catch any unexpected errors during the process.
    console.error('Serverless Function Error: An unexpected error occurred in firebase-config-proxy.', error);
    return res.status(500).json({
        success: false,
        message: 'An internal server error occurred.'
    });
  }
}
