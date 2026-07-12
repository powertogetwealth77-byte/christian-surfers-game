/**
 * Sentry-ready error reporting seam. Product code calls `reportError`;
 * wiring Sentry later is a one-file change.
 */

type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void;

let reporter: ErrorReporter = (error, context) => {
  if (__DEV__) console.error('[error]', error, context ?? {});
};

export function setErrorReporter(next: ErrorReporter) {
  reporter = next;
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  try {
    reporter(error, context);
  } catch {
    /* reporting must never throw */
  }
}

export function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}
