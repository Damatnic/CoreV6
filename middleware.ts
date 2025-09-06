/**
 * Next.js Middleware Entry Point
 * Coordinates all middleware functions
 */

import { securityMiddleware } from './src/middleware/securityMiddleware';

export { securityMiddleware as middleware };