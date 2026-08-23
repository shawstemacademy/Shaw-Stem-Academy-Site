import { captureClientMetadata, fetchClientIp } from './clientMetadata';
import { saveDocToFirestore } from './firebase';
import { SystemActionLog, SchoolUser } from '../types';

let currentUserGetter: (() => SchoolUser | null) | null = null;

export function registerUserGetterForErrorLogger(getter: () => SchoolUser | null) {
  currentUserGetter = getter;
}

export async function logAppError(
  error: Error | string | unknown,
  contextInfo?: {
    component?: string;
    action?: string;
    errorInfo?: any;
    metadata?: any;
  }
): Promise<SystemActionLog | null> {
  try {
    const errObj = typeof error === 'string' ? new Error(error) : (error as Error);
    const errName = errObj?.name || 'ApplicationError';
    const errMsg = errObj?.message || String(error) || 'An unknown error occurred';
    const errStack = errObj?.stack || undefined;

    let actor = 'System';
    let actorUserId: string | undefined;
    let actorEmail: string | undefined;
    let actorRole: string | undefined;

    const loggedInUser = currentUserGetter ? currentUserGetter() : null;
    if (loggedInUser) {
      actor = `${loggedInUser.title || loggedInUser.role} • ${loggedInUser.name}`;
      actorUserId = loggedInUser.id;
      actorEmail = loggedInUser.email;
      actorRole = loggedInUser.role;
    } else {
      actor = 'Anonymous / Guest User';
      actorRole = 'guest';
    }

    const clientMeta = captureClientMetadata();
    let ip = clientMeta.ipAddress;
    if (ip === 'Detecting IP...' || !ip) {
      try {
        ip = await fetchClientIp();
      } catch {
        ip = 'Unknown';
      }
    }

    const actionDescription = contextInfo?.action
      ? `App Error in [${contextInfo.action}]: ${errMsg}`
      : `App Error: ${errMsg}`;

    const newLog: SystemActionLog = {
      id: `err-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      actionType: 'app_error',
      actor,
      actorUserId,
      actorEmail,
      actorRole,
      description: actionDescription,
      ipAddress: ip,
      userAgent: clientMeta.userAgent,
      browser: clientMeta.browser,
      os: clientMeta.os,
      deviceType: clientMeta.deviceType,
      screenResolution: clientMeta.screenResolution,
      viewportSize: clientMeta.viewportSize,
      timeZone: clientMeta.timeZone,
      language: clientMeta.language,
      path: typeof window !== 'undefined' ? window.location?.pathname : clientMeta.path,
      errorName: errName,
      errorMessage: errMsg,
      errorStack: errStack,
      componentStack: contextInfo?.errorInfo?.componentStack || contextInfo?.component,
      metadata: contextInfo?.metadata,
    };

    await saveDocToFirestore('systemActionLogs', newLog.id, newLog);
    return newLog;
  } catch (loggingErr) {
    console.error('Failed to save app error log to Firestore:', loggingErr);
    return null;
  }
}

export function initGlobalErrorListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    if (event.message?.includes('vite') || event.message?.includes('WebSocket')) return;

    logAppError(event.error || event.message, {
      action: 'Uncaught Window Exception',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (typeof reason === 'string' && (reason.includes('WebSocket') || reason.includes('vite'))) return;

    logAppError(reason || 'Unhandled Promise Rejection', {
      action: 'Unhandled Promise Rejection',
      metadata: { reason: String(reason) },
    });
  });

  window.addEventListener('firestore-error', (event: any) => {
    const detail = event.detail;
    if (detail?.error) {
      logAppError(new Error(detail.error), {
        action: `Firestore ${detail.operationType || 'Database'} Error`,
        metadata: detail,
      });
    }
  });
}
