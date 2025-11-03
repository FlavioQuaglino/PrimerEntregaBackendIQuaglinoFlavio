import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

// Importación de la conexión a la base de datos
import connectDB from './config/db.config.js'; 

// Importar Routers (Asegúrate de que los routers también usan "export default")
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';

// Importación del Manager (Manager adaptado para Mongoose)
import ProductManager from './managers/ProductManager.js'; 

// Configuración de rutas para ESM (Reemplaza '__dirname' con compatibilidad)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ===================================
// 1. CONEXIÓN A LA BASE DE DATOS
// ===================================
connectDB(); 

// 2. CREAR SERVIDOR HTTP Y SOCKET.IO
const server = http.createServer(app);
const io = new Server(server);

const productManager = new ProductManager(); 

// 3. CONFIGURACIÓN DE HANDLEBARS (Añadiendo el helper 'eq' necesario)
app.engine('handlebars', engine({
    helpers: {
        // Helper para comparar igualdad, necesario para los <select> en home.handlebars
        eq: (v1, v2) => v1 === v2,
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views')); 

// 4. MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// 5. CONEXIÓN DE ROUTERS
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// 6. LÓGICA DE WEBSOCKETS (Ahora interactúa con Mongoose a través del Manager)
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado por WebSockets 🟢');

    // Emitir productos iniciales (ahora desde MongoDB)
    socket.on('getInitialProducts', async () => {
        try {
            // Se usa el Manager que consulta a Mongoose. Se pasa criteria/options vacíos
            const productsData = await productManager.getProducts({}, { limit: 100, lean: true });
            socket.emit('productsUpdate', productsData.docs);
        } catch (error) {
            console.error("Error al obtener productos iniciales por socket:", error.message);
        }
    });

    // Añadir nuevo producto (persiste en MongoDB)
    socket.on('newProduct', async (productData) => {
        try {
            await productManager.addProduct(productData);
            // Volver a obtener la lista completa para actualizar a todos los clientes
            const updatedProductsData = await productManager.getProducts({}, { limit: 100, lean: true });
            io.emit('productsUpdate', updatedProductsData.docs);
        } catch (error) {
            console.error("Error al agregar producto por socket:", error.message);
            // Opcional: emitir un error solo al cliente que lo intentó
            socket.emit('productError', "Error al agregar producto: " + error.message);
        }
    });

    // Eliminar producto (de MongoDB)
    socket.on('deleteProduct', async (productId) => {
        try {
            await productManager.deleteProduct(productId);
            const updatedProductsData = await productManager.getProducts({}, { limit: 100, lean: true });
            io.emit('productsUpdate', updatedProductsData.docs);
        } catch (error) {
            console.error("Error al eliminar producto por socket:", error);
            socket.emit('productError', "Error al eliminar producto: " + error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado 🔴');
    });
});


// 7. INICIAR EL SERVIDOR
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🏠 Vista Home: http://localhost:${PORT}/`);
    console.log(`⏳ Vista Real Time: http://localhost:${PORT}/realtimeproducts`);
});