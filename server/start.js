const { exec } = require('child_process');
const net = require('net');

const PORT = process.env.PORT || 5000;

// Check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port);
  });
}

async function start() {
  const isAvailable = await checkPort(PORT);
  
  if (!isAvailable) {
    console.log(`Port ${PORT} is in use. Attempting to free it...`);
    
    // Kill processes on Windows
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          const pids = new Set();
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          });
          
          pids.forEach(pid => {
            console.log(`Killing process ${pid}...`);
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (err) {
                console.error(`Failed to kill process ${pid}`);
              }
            });
          });
          
          setTimeout(() => {
            console.log('Starting server...');
            require('./index.js');
          }, 2000);
        }
      });
    } else {
      console.error(`Port ${PORT} is in use. Please free it manually.`);
      process.exit(1);
    }
  } else {
    console.log('Starting server...');
    require('./index.js');
  }
}

start();
