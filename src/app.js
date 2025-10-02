const express = require('express');
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/carts.router.js');
const app = express();
const PORT = 8080;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Prueba las rutas en Postman:`);
    console.log(`- Productos: http://localhost:${PORT}/api/products`);
    console.log(`- Carritos: http://localhost:${PORT}/api/carts`);
});