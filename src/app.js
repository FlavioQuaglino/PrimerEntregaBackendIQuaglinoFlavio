import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { create } from 'express-handlebars';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const hbs = create({
  defaultLayout: 'main',
  helpers: {
    multiply: (a, b) => a * b,
    ifEquals: (a, b, options) => (a == b ? options.fn(this) : options.inverse(this)),
    json: context => JSON.stringify(context),
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
  },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// --- Socket.IO ---
io.on('connection', socket => {
  console.log('🟢 Cliente conectado a WebSocket');

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado de WebSocket');
  });
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

app.get('/', (req, res) => {
  res.redirect('/products');
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Página no encontrada',
    message: `La ruta "${req.originalUrl}" no existe.`,
    status: 404,
  });
});

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📦 Productos: http://localhost:${PORT}/products`);
      console.log(`⚡ Tiempo real: http://localhost:${PORT}/realtimeproducts`);
      console.log(`🛒 Carrito: http://localhost:${PORT}/carts/ID_DEL_CARRITO`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1);
  });

export { io };
