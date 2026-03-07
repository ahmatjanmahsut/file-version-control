const { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const log = require('electron-log')
const { exec } = require('child_process')

log.transports.file.level = 'info'
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log')

let mainWindow = null
let tray = null

process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error)
  app.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的Promise拒绝:', reason)
})

function createWindow() {
  log.info('正在创建主窗口...')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false
  })

  mainWindow.loadFile('index.html')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    log.info('主窗口已显示')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
    createTray()
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      createTray()
    }
  })
}

function createTray() {
  if (tray) return

  const iconPath = path.join(__dirname, 'icon.png')
  let trayIcon

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty()
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        }
      }
    },
    { type: 'separator' },
    {
      label: '启动后端服务',
      click: () => {
        startBackend()
      }
    },
    {
      label: '停止后端服务',
      click: () => {
        stopBackend()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('工艺文件管理系统')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '启动后端服务',
          click: () => startBackend()
        },
        {
          label: '停止后端服务',
          click: () => stopBackend()
        },
        { type: 'separator' },
        {
          label: '打开前端页面',
          click: () => shell.openExternal('http://localhost:3000')
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.isQuitting = true
            app.quit()
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '工艺文件版本控制系统',
              detail: '版本: 1.0.0\n用于管理工艺文件的版本控制系统\n包含用户管理和文件版本控制功能'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function startBackend() {
  log.info('正在启动后端服务...')
  const backendPath = path.join(__dirname, '..', 'backend')

  exec('cd /d "' + backendPath + '" && npm start', (error, stdout, stderr) => {
    if (error) {
      log.error('启动后端失败:', error)
      return
    }
    log.info('后端服务已启动:', stdout)
  })
}

function stopBackend() {
  log.info('正在停止后端服务...')

  exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
    if (error) {
      log.error('停止后端失败:', error)
      return
    }
    log.info('后端服务已停止')
  })
}

app.whenReady().then(() => {
  log.info('应用启动...')
  createMenu()
  createWindow()
  startBackend()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
  stopBackend()
})

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('start-backend', () => {
  startBackend()
})

ipcMain.handle('stop-backend', () => {
  stopBackend()
})
