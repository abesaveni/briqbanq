/**
 * Service Layer - Centralized exports for all borrower services
 * 
 * This layer provides a clean abstraction between components and API calls.
 * All services follow the same pattern:
 * 1. Try API call first
 * 2. On success: update localStorage as cache
 * 3. On network error: use localStorage as fallback
 * 4. On other errors: throw error (let component handle)
 * 
 * This makes it easy to integrate with a backend later - just update the API endpoints
 * and the services will handle caching/fallback automatically.
 */

export { profileService } from './profileService'
export { organizationService } from './organizationService'
export { securityService } from './securityService'
export { notificationService } from './notificationService'
export { userManagementService } from './userManagementService'
export { moduleSettingsService } from './moduleSettingsService'
