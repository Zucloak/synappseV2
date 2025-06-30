// status-checker.ts

interface WorkstationStatusResponse {
  status: 'online' | 'offline';
  message: string;
}

async function checkWorkstationStatus(): Promise<void> {
  const statusDot = document.getElementById('workstation-status-dot') as HTMLSpanElement | null;
  const statusText = document.getElementById('workstation-status-text') as HTMLSpanElement | null;

  if (!statusDot || !statusText) {
    console.error("Status indicator elements not found in the DOM. Ensure IDs 'workstation-status-dot' and 'workstation-status-text' are correct in index.html.");
    return;
  }

  try {
    // Call your Vercel API route (relative path works if deployed on same Vercel project)
    const response = await fetch('/api/workstation-status');
    const data: WorkstationStatusResponse = await response.json();

    if (data.status === 'online') {
      statusDot.style.backgroundColor = 'green';
      statusText.textContent = 'AI Quizzing Service Status: Online (Accepting bookings!)';
      statusDot.title = 'AI Quizzing Service: Online and Ready for Booking';
    } else {
      statusDot.style.backgroundColor = 'red';
      statusText.textContent = 'AI Quizzing Service Status: Offline (Check booking schedule)';
      statusDot.title = 'AI Quizzing Service: Offline. Check booking schedule or contact us.';
    }
  } catch (error) {
    console.error('Failed to fetch workstation status API:', error);
    statusDot.style.backgroundColor = 'red';
    statusText.textContent = 'AI Quizzing Service Status: Error checking status.';
    statusDot.title = 'AI Quizzing Service: Status unknown (error fetching).';
  }
}

// Ensure the function runs when the DOM is fully loaded
// This is important for plain HTML/JS sites
document.addEventListener('DOMContentLoaded', () => {
  checkWorkstationStatus(); // Run once on page load

  // Optional: Poll periodically to keep the status updated
  // Adjust the interval (milliseconds) as you see fit
  setInterval(checkWorkstationStatus, 60 * 1000); // Check every 60 seconds (1 minute)
});
