interface Window {
  electronAPI: {
    platform: string
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void
    // Electron store methods for redux-persist
    storeGet: (key: string) => Promise<string | null>
    storeSet: (key: string, value: string) => Promise<boolean>
    storeRemove: (key: string) => Promise<boolean>
  }
}
