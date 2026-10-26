import { shallowRef } from 'vue'

// UI selection only; verified account state must come from the account service.
export const accountPlatform = shallowRef<{ id: string; name: string } | null>(null)
export function openPlatformAccount(id: string, name: string) {
  accountPlatform.value = { id, name }
}
