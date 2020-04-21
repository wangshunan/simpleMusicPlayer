// Modules to control application life and create native browser window
const { dialog, app, BrowserWindow, ipcMain, screen } = require('electron')
const DataStore = require('./renderer/MusicDataStore')
const myStore = new DataStore({'name': 'Music Data'})

// Parent window class
class AppWindow extends BrowserWindow {
  constructor(config, fileLocation){
    const basicConfig = {
      webPreferences: {
        nodeIntegration: true
      },
      show: false
    }

    const finalConfig = Object.assign(basicConfig, config)
    super(finalConfig)
    this.loadFile(fileLocation)
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

app.on ('ready', () => {
  // Get screen size 
  const size = screen.getPrimaryDisplay().size 
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor
  const dWidth = parseInt(size.width * scaleFactor)
  const dHeight = parseInt(size.height * scaleFactor)

  // Create main window
  const mainWindow = new AppWindow({
    width: parseInt(dWidth / 2.4),
    height: parseInt(dHeight / 1.8),
    resizable: false
  }, './renderer/index.html')
  // Load play list
  mainWindow.webContents.on('did-finish-load', () => {
    const updatedTracks = myStore.getTracks()
    mainWindow.send('setPlayListStyle', dHeight)
    mainWindow.send('getTracks', updatedTracks)
  })

  // Create add window
  ipcMain.on('add-music-window', () => {
    if ( mainWindow.getChildWindows().length < 1 ) { 
      const addWindow = new AppWindow({
        width: parseInt(dWidth / 3.2),
        height: parseInt(dHeight / 2.16),
        parent: mainWindow,
        modal: true,
        resizable: false
      }, './renderer/add.html')

      addWindow.setMenu(null)
      // addWindow.webContents.openDevTools()
    }
  })

  // Open music file
  ipcMain.on('open-music-file', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'music file', extensions: ['mp3', "m4a","flac"] }]
    }).then(result  => {
      if (result) {
        event.sender.send('selected-file', result.filePaths)
      }
    })
  })

  // Add tracks
  ipcMain.on('add-tracks', async(event, tracks) => {
    const updatedTracks = await (await myStore.addTracks(tracks)).getTracks()
    mainWindow.send('getTracks', updatedTracks)
    mainWindow.getChildWindows()[0].close()
  })

  // Delete track
  ipcMain.on('delete-track', (event, id) => {
    const updatedTracks = myStore.deleteTrack(id).getTracks()
    mainWindow.send('getTracks', updatedTracks)
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
})
