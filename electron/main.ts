import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize electron-store for persistent storage
const store = new Store({
  name: 'redux-persist',
  defaults: {}
})

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(__dirname, '../dist-electron')

let win: BrowserWindow | null = null

// IPC handlers for electron-store (redux-persist storage)
ipcMain.handle('electron-store-get', async (_event, key: string) => {
  try {
    const value = store.get(key)
    return value !== undefined ? JSON.stringify(value) : null
  } catch (error) {
    console.error('electron-store-get error:', error)
    return null
  }
})

ipcMain.handle('electron-store-set', async (_event, key: string, value: string) => {
  try {
    store.set(key, JSON.parse(value))
    return true
  } catch (error) {
    console.error('electron-store-set error:', error)
    return false
  }
})

ipcMain.handle('electron-store-remove', async (_event, key: string) => {
  try {
    store.delete(key)
    return true
  } catch (error) {
    console.error('electron-store-remove error:', error)
    return false
  }
})

ipcMain.on('window-control', (event, action: 'minimize' | 'maximize' | 'close') => {
  const window = BrowserWindow.fromWebContents(event.sender)

  if (!window) {
    return
  }

  if (action === 'minimize') {
    window.minimize()
    return
  }

  if (action === 'maximize') {
    if (window.isMaximized()) {
      window.unmaximize()
      return
    }

    window.maximize()
    return
  }

  window.close()
})

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    backgroundColor: '#191919', // Màu nền trùng với app background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  })

  // Allow YouTube iframe to embed by removing restrictive headers
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }
    
    // Remove headers that might block YouTube iframe
    delete responseHeaders['X-Frame-Options']
    delete responseHeaders['x-frame-options']
    delete responseHeaders['Content-Security-Policy']
    delete responseHeaders['content-security-policy']
    
    callback({ responseHeaders })
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    const distElectron = process.env.DIST_ELECTRON
    if (distElectron) {
      win.loadFile(path.join(distElectron, 'dist/index.html'))
    }
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
})
