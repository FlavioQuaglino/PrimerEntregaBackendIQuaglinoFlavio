const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); 

const productManager = new ProductManager('products.json'); 
const router = Router();

router.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        
        res.render('home', { products, title: 'Lista de Productos' }); 
    } catch (error) {
        console.error('Error al cargar la vista home:', error);
        res.status(500).render('error', { message: 'No se pudieron cargar los productos.' });
    }
});

router.get('/realtimeproducts', async (req, res) => {
    try {
        res.render('realTimeProducts', { title: 'Productos en Tiempo Real' });
    } catch (error) {
        console.error('Error al cargar la vista realTimeProducts:', error);
        res.status(500).render('error', { message: 'Error al cargar la vista en tiempo real.' });
    }
});

module.exports = router;