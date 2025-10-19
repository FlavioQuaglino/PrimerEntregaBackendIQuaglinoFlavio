const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); // Asumiendo que esta es la ruta correcta

const productManager = new ProductManager('products.json'); 
const router = Router();

// Ruta para la vista HOME (Lista estática)
router.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        
        // Renderiza home.handlebars, pasando la lista de productos
        res.render('home', { products, title: 'Lista de Productos' }); 
    } catch (error) {
        console.error('Error al cargar la vista home:', error);
        res.status(500).render('error', { message: 'No se pudieron cargar los productos.' });
    }
});

// Ruta para la vista REAL TIME (Lista con WebSockets)
router.get('/realtimeproducts', async (req, res) => {
    try {
        // En esta vista solo cargamos la estructura HTML. 
        // El contenido (la lista de productos) se maneja DESDE el frontend por Sockets.
        res.render('realTimeProducts', { title: 'Productos en Tiempo Real' });
    } catch (error) {
        console.error('Error al cargar la vista realTimeProducts:', error);
        res.status(500).render('error', { message: 'Error al cargar la vista en tiempo real.' });
    }
});

module.exports = router;