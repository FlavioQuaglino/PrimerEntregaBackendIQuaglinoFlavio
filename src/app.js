// src/app.js

const express = require('express');
// Importar los routers que definen los endpoints
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/carts.router.js');

const app = express();
const PORT = 8080;

// Middlewares obligatorios para Express
app.use(express.json()); // Para parsear el body de las peticiones JSON
app.use(express.urlencoded({ extended: true })); // Para parsear datos de formularios

// Montar las rutas: /api/products y /api/carts
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Inicializar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Prueba las rutas en Postman:`);
    console.log(`- Productos: http://localhost:${PORT}/api/products`);
    console.log(`- Carritos: http://localhost:${PORT}/api/carts`);
});