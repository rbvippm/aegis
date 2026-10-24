export const languageOptions = [
  { id: 'zh-Hans', label: '简体', button: '中文' },
  { id: 'zh-Hant', label: '繁体', button: '繁体' },
  { id: 'en', label: '英文', button: '英文' },
  { id: 'vi', label: '越南文', button: '越南文' },
  { id: 'th', label: '泰文', button: '泰文' },
] as const

export type LanguageId = (typeof languageOptions)[number]['id']
