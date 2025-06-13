export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./opentelemetry');
    console.log('OpenTelemetry loaded');
  }
}
