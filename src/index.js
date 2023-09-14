// usar variables de entorno del .env

import { config } from 'dotenv';
config();
////////////////////////////
import http from 'http';
import app from './app.js';

const PORT = process.env.PORT;

const server = http.createServer(app);

function startServer() {
  server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
  });
}

startServer();
