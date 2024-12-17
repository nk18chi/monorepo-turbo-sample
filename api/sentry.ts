import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://76d28740317794fba52e02e4e610bb46@o4507949443186688.ingest.us.sentry.io/4508446867128320',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  profilesSampleRate: 1.0, // Set sampling rate for profiling
});
