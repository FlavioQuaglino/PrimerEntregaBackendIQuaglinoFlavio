const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { engine } = require('express-handlebars'); 

// 1. IMPORTAR ROUTERS
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/carts.router.js');
const viewsRouter = require('./routes/views.router.js'); 
const ProductManager = require('./managers/ProductManager');

const app = express();
const PORT = 3000;

// 2. CREAR SERVIDOR HTTP Y SOCKET.IO
const server = http.createServer(app); 
const io = new Server(server); 
const productManager = new ProductManager('products.json'); 

// 3. CONFIGURACIÓN DE HANDLEBARS
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

// 4. MIDDLEWARES
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public'));

// 5. CONEXIÓN DE ROUTERS
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter); 


// 6. LÓGICA DE WEBSOCKETS
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado por WebSockets 🟢');

    socket.on('getInitialProducts', async () => {
        const initialProducts = await productManager.getProducts();
        socket.emit('productsUpdate', initialProducts);
    });

    socket.on('newProduct', async (productData) => {
        try {
            await productManager.addProduct(productData);
            const updatedProducts = await productManager.getProducts();
            io.emit('productsUpdate', updatedProducts); 
        } catch (error) {
            console.error("Error al agregar producto por socket:", error.message);
        }
    });

    socket.on('deleteProduct', async (productId) => {
        try {
            await productManager.deleteProduct(productId);
            const updatedProducts = await productManager.getProducts();
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