export default async function handler(req, res) {
  const targetUrl = 'https://9000-firebase-studio-1751029512083.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev';
  const timeout = 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      res.status(200).json({ status: 'online', message: 'Workstation is reachable.' });
    } else {
      res.status(200).json({ status: 'offline', message: 'Workstation responded with an error status.' });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    res.status(200).json({ status: 'offline', message: 'Workstation is unreachable or network error.' });
  }
}
