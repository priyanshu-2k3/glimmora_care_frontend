/**
 * Centralized role definitions for GlimmoraCare.
 *
 * These string values match the frontend Role type in types/auth.ts.
 * Backend role mapping happens in lib/api.ts (backendRoleToFrontend).
 */

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NGO = 'ngo_worker',
  GOVERNMENT_ANALYST = 'gov_analyst',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
