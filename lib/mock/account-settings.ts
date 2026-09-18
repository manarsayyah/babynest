/**
 * Local-only preferences for the Customer Account Settings page (privacy +
 * communication toggles). No backend exists yet, so these are plain
 * component state seeds — kept here, separate from the page component, so
 * it's a one-file swap once a real `/api/account/settings` endpoint exists.
 * Profile email and security status are NOT duplicated here — they're
 * reused directly from the existing `initialProfile`/`securityInfo` in
 * `lib/mock/account.ts`.
 */
export type PrivacySettings = {
  personalizedExperience: boolean
  useActivityForRecommendations: boolean
}

export const defaultPrivacySettings: PrivacySettings = {
  personalizedExperience: true,
  useActivityForRecommendations: true,
}

export type CommunicationSettings = {
  email: boolean
  marketing: boolean
}

export const defaultCommunicationSettings: CommunicationSettings = {
  email: true,
  marketing: false,
}
