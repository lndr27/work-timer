const fs = require('fs');
const electron = require('electron');
const { app, BrowserWindow, ipcMain, Menu } = electron
const path = require('path')
const url = require('url')

let mainWindow;
let menuPrincipal;

app.on('ready', () => {

    let display = electron.screen.getPrimaryDisplay();
    let width = display.bounds.width;

    mainWindow = new BrowserWindow({ 
        width: 600, 
        height: 150,
        minWidth: 600,
        minHeight: 150,
        x: width - 600,
        y: display.bounds.height - 200,
        frame: false,
        opacity: 0.65,
        alwaysOnTop: true
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/dashboard.html'),
        protocol: 'file:',
        slashes: true
    }));

    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => mainWindow = null);

    registrarRendererListeners();

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
});

const registrarRendererListeners = () => {
    ipcMain.on('sair', app.quit);
    ipcMain.on('set-opacity', (evt, opacity) => {
        mainWindow.setOpacity(+opacity);
    });

    ipcMain.on('alwaysOnTop', () => {
        mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
    });

    let writing = false;
    ipcMain.on('save-to-file', function (evt, timesheet) {

        if (writing) { return; }
        writing = true;

        var path = process.env.LOCALAPPDATA + '\\work-timer';
        var fileName = 'backup.json';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }
        fs.writeFileSync(`${path}\\${fileName}`, JSON.stringify(timesheet));
        writing = false;
    });

    ipcMain.on('get-backup', (event) => {
        fs.readFile(process.env.LOCALAPPDATA + '\\work-timer\\backup.json', 'utf-8', (err, data) => {
            if (err) { return; }
            event.sender.send('get-backup-response', data);
        });
    });

};



