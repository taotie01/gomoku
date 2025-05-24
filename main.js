const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "build", "icon.ico"),
    webPreferences: {
      // 删除或注释掉这行
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
 // 对于 macOS，需要单独处理
 if (process.platform === 'darwin') {
  app.dock.setIcon(path.join(__dirname, 'build', 'icon.icns'));
}
  // 加载 public 目录下的 wuziqi.html
  mainWindow.loadFile(path.join(__dirname, "public", "wuziqi.html"));

  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
