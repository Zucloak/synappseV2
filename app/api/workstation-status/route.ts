import { NextResponse } from 'next/server';

// This is the standard handler function name for Next.js App Router API routes.
// In a Vercel environment, you would place this in a file like `/api/check-status.ts`
// or `/app/api/check-status/route.ts` for Next.js App Router.
export async function GET() {
  // The external URL you want to check
  const targetUrl = 'https://9000-firebase-studio-1751029512083.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev';
  
  // Set a timeout for the request
  const timeout = 5000; // 5 seconds

  // Use AbortController for timeout handling, which is standard in modern fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Perform a HEAD request for efficiency
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    // Clear the timeout if the request completes in time
    clearTimeout(timeoutId);

    // Check if the response status is in the 200-299 range
    if (response.ok) {
      return NextResponse.json(
        { status: 'online', message: 'Workstation is reachable.' },
        { status: 200 }
      );
    } else {
      // Handle 4xx or 5xx error statuses
      return NextResponse.json(
        { status: 'offline', message: 'Workstation responded with an error status.' },
        { status: 200 } // Return 200 to the client, but with an 'offline' status
      );
    }
  } catch (error) {
    // This block catches network errors, timeouts, etc.
    clearTimeout(timeoutId);
    
    return NextResponse.json(
      { status: 'offline', message: 'Workstation is unreachable or network error.' },
      { status: 200 } // Return 200 to the client, but with an 'offline' status
    );
  }
}
