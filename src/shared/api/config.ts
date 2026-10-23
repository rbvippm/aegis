const configuredMode = import.meta.env.VITE_DATA_MODE ?? 'demo'
if (!['demo', 'api'].includes(configuredMode)) throw new Error('VITE_DATA_MODE 必须为 demo 或 api')
export const dataMode = configuredMode as 'demo' | 'api'
export const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
