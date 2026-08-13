/**
 * Utility for capturing detailed client browser, OS, device, and network metadata
 * for system action logs.
 */

let cachedIpAddress: string | null = null;
let isFetchingIp = false;

/**
 * Parses browser name and version from user agent
 */
export function getBrowserInfo(ua: string): { name: string; version: string } {
  if (!ua) return { name: 'Unknown Browser', version: '' };

  let name = 'Unknown Browser';
  let version = '';

  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    version = ua.split('Firefox/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Edg/')) {
    name = 'Microsoft Edge';
    version = ua.split('Edg/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Chrome/')) {
    name = 'Google Chrome';
    version = ua.split('Chrome/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name = 'Safari';
    version = ua.split('Version/')[1]?.split(' ')[0] || ua.split('Safari/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    name = 'Opera';
    version = ua.split('OPR/')[1]?.split(' ')[0] || '';
  }

  return { name, version: version.split('.')[0] ? `${name} ${version.split('.')[0]}` : name };
}

/**
 * Parses operating system name and version from user agent
 */
export function getOSInfo(ua: string): string {
  if (!ua) return 'Unknown OS';

  if (ua.includes('Win')) {
    if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    return 'Windows';
  }
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    if (ua.includes('Mac OS X 14') || ua.includes('Mac OS X 15')) return 'macOS Sonoma/Sequoia';
    if (ua.includes('Mac OS X 13')) return 'macOS Ventura';
    if (ua.includes('Mac OS X 12')) return 'macOS Monterey';
    return 'macOS';
  }
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';

  return 'Unknown OS';
}

/**
 * Determines device category
 */
export function getDeviceType(ua: string): 'Desktop' | 'Mobile' | 'Tablet' {
  if (!ua) return 'Desktop';

  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  if (isTablet) return 'Tablet';

  const isMobile = /(mobi|ipod|iphone|blackberry|opera mini|femobile|palm|psp|symbian|windows phone)/i.test(ua);
  if (isMobile) return 'Mobile';

  return 'Desktop';
}

/**
 * Asynchronously retrieves and caches the client IP address
 */
export async function fetchClientIp(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;
  if (isFetchingIp) return 'Fetching IP...';

  isFetchingIp = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.ip) {
        cachedIpAddress = data.ip;
        isFetchingIp = false;
        return data.ip;
      }
    }
  } catch (err) {
    // Fallback if blocked or offline
  }

  isFetchingIp = false;
  cachedIpAddress = '127.0.0.1 (Local)';
  return cachedIpAddress;
}

// Initial background IP lookup on module load
if (typeof window !== 'undefined') {
  fetchClientIp().catch(() => {});
}

export interface ClientMetadata {
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  screenResolution: string;
  viewportSize: string;
  timeZone: string;
  language: string;
  path: string;
}

/**
 * Captures a complete snapshot of current client environment metadata
 */
export function captureClientMetadata(): ClientMetadata {
  if (typeof window === 'undefined') {
    return {
      ipAddress: '127.0.0.1',
      userAgent: 'Server Environment',
      browser: 'Server',
      os: 'Node.js',
      deviceType: 'Desktop',
      screenResolution: 'N/A',
      viewportSize: 'N/A',
      timeZone: 'UTC',
      language: 'en-US',
      path: '/',
    };
  }

  const ua = navigator.userAgent || '';
  const browserInfo = getBrowserInfo(ua);
  const osInfo = getOSInfo(ua);
  const deviceType = getDeviceType(ua);

  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    // Ignore timezone resolution error
  }

  return {
    ipAddress: cachedIpAddress || 'Detecting IP...',
    userAgent: ua,
    browser: browserInfo.version || browserInfo.name,
    os: osInfo,
    deviceType,
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewportSize: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
    timeZone,
    language: navigator.language || 'en-US',
    path: window.location.pathname || '/',
  };
}
