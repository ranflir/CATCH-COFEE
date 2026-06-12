export function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export function logError(message: string, err: unknown): void {
  console.error(`[${new Date().toISOString()}] ${message}`, err);
}
