const express = require('express');
const http = require('http'); // Necesario para integrar Socket.io
const { Server } = require('socket.io'); // Clase Server de Socket.io
const { engine } = require('express-handlebars'); // Motor de Handlebars

// 1. IMPORTAR ROUTERS
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/carts.router.js');
const viewsRouter = require('./routes/views.router.js'); // <-- ¡Nuevo Router de Vistas!
const ProductManager = require('./managers/ProductManager'); // Para la lógica de sockets

const app = express();
const PORT = 3000;

// 2. CREAR SERVIDOR HTTP Y SOCKET.IO
const server = http.createServer(app); // Crea el servidor HTTP a partir de Express
const io = new Server(server); // Inicializa Socket.io en el servidor HTTP
const productManager = new ProductManager('products.json'); // Instancia para sockets

// 3. CONFIGURACIÓN DE HANDLEBARS
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views'); // Ajusta la ruta a tu carpeta de vistas

// 4. MIDDLEWARES
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public')); // Sirve archivos estáticos (JS/CSS para el frontend)

// 5. CONEXIÓN DE ROUTERS
// Rutas de API REST
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
// Rutas de Vistas (Handlebars) - Conectadas en la raíz '/'
app.use('/', viewsRouter); 


// 6. LÓGICA DE WEBSOCKETS
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado por WebSockets 🟢');

    // Maneja la solicitud de la lista inicial al conectar
    socket.on('getInitialProducts', async () => {
        const initialProducts = await productManager.getProducts();
        socket.emit('productsUpdate', initialProducts);
    });

    // Recibe producto nuevo del cliente (realTimeProducts.js)
    socket.on('newProduct', async (productData) => {
        try {
            await productManager.addProduct(productData);
            const updatedProducts = await productManager.getProducts();
            // Emite la lista actualizada a *todos* los clientes conectados
            io.emit('productsUpdate', updatedProducts); 
        } catch (error) {
            console.error("Error al agregar producto por socket:", error.message);
        }
    });

    // Recibe solicitud de eliminación
    socket.on('deleteProduct', async (productId) => {
        try {
            await productManager.deleteProduct(productId);
            const updatedProducts = await productManager.getProducts();
            // Emite la lista actualizada a *todos* los clientes conectados
            io.emit('productsUpdate', updatedProducts); 
        } catch (error) {
            console.error("Error al eliminar producto por socket:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado 🔴');
    });
});


// 7. INICIAR EL SERVIDOR (Usamos 'server' en lugar de 'app')
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🏠 Vista Home: http://localhost:${PORT}/`);
    console.log(`⏳ Vista Real Time: http://localhost:${PORT}/realtimeproducts`);
});