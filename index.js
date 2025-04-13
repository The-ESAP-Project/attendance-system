require('dotenv').config();

const os = require('os');
const fs = require('fs');
const Path = require('path');
const express = require('express');
const cluster = require('cluster');

// const models = require('./models');
const { connectDatabase, closeDatabase, syncDatabase } = require('./db');


const NEED_INIT_DB = process.env.NEED_INIT === 'true';
const API_BASE_ROUTE = process.env.API_BASE_ROUTE || '/api/v1';
const numCPUs = process.env.NODE_ENV === 'development' ? 1 : os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  const pidFile = Path.join(__dirname, 'spm_backend.pid');
  fs.writeFileSync(pidFile, process.pid.toString());

  (async () => {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Failed to connect to database, shutting down server...');
      process.exit(1);
    }

    const synced = await syncDatabase( NEED_INIT_DB );
    if (!synced) {
      console.error('Failed to sync database, shutting down server...');
      process.exit(1);
    }
    
    console.log('Database connection established in master process');

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  })();

  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal, shutting down server...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGINT');
    }
    
    await closeDatabase();
    
    fs.unlinkSync(pidFile);
    console.log('Removed PID file');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal, shutting down server...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    
    await closeDatabase();
    
    fs.unlinkSync(pidFile);
    console.log('Removed PID file');
    process.exit(0);
  });

  process.on('uncaughtException', async (err) => {
    console.error(`Process ${process.pid} uncaught exception:`, err);
    
    await closeDatabase();
    process.exit(1);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log('Worker crashed, starting a new worker...');
      cluster.fork();
    }
  });

} else {
  console.log(`Worker process ${process.pid} is running`);
  const app = express();

  app.use(require('helmet')());

  const PORT = process.env.PORT || 8012;
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];

  const server = require('http').createServer(app);

  app.use(async (req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(require('body-parser').json());

  app.use(`${API_BASE_ROUTE}`, require('./routes/index'));
 
  app.use(`${API_BASE_ROUTE}/*`, (req, res) => {
    res.status(404).json({
      code: -1,
      message: `API endpoint not found: ${req.originalUrl}`,
      data: null
    });
  });

  app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
      code: -1, 
      message: 'Internal server error',
      data: process.env.NODE_ENV === 'development' ? err.message : null
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      throw error;
    }
  });

  process.on('uncaughtException', (err) => {
    console.error(`Worker process ${process.pid} uncaught exception:`, err);
    
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`Worker process ${process.pid} unhandled promise rejection:`, reason);
  });

  process.on('SIGINT', () => {
    console.log(`Worker process ${process.pid} received SIGINT signal, shutting down server...`);
    server.close(() => {
      console.log(`Worker process ${process.pid} has closed HTTP server`);
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log(`Worker process ${process.pid} received SIGTERM signal, shutting down server...`);
    server.close(() => {
      console.log(`Worker process ${process.pid} has closed HTTP server`);
      process.exit(0);
    });
  });

  process.on('exit', (code) => {
    console.log(`Worker process ${process.pid} exited with code ${code}`);
  });
}