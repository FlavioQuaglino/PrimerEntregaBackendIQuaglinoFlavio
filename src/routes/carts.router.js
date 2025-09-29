// src/routes/carts.router.js

const { Router } = require('express');
// Importamos ambos managers, el CartManager necesita al ProductManager
const ProductManager = require('../managers/ProductManager'); 
const CartManager = require('../managers/CartManager');

const productManager = new ProductManager('products.json'); // Instancia para validar productos
const cartManager = new CartManager('carts.json', productManager); 
const router = Router();

// Middleware para manejo de errores (copiado del products.router.js)
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/carts/ - Crea un nuevo carrito
router.post('/', asyncHandler(async (req, res) => {
    const newCart = await cartManager.createCart();
    res.status(201).json({ message: 'Carrito creado exitosamente', cart: newCart });
}));

// GET /api/carts/:cid - Lista los productos de un carrito
router.get('/:cid', asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const productsInCart = await cartManager.getCartById(cid);

    if (!productsInCart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    // Devuelve el array de productos del carrito
    res.json(productsInCart);
}));

// POST /api/carts/:cid/product/:pid - Agrega un producto a un carrito
router.post('/:cid/product/:pid', asyncHandler(async (req, res) => {
    const { cid, pid } = req.params;
    
    try {
        const updatedCart = await cartManager.addProductToCart(cid, pid);
        
        if (!updatedCart) {
            return res.status(404).json({ error: 'Carrito no encontrado para agregar producto' });
        }
        
        res.json({ message: 'Producto agregado/incrementado en el carrito', cart: updatedCart });
    } catch (error) {
        // Captura errores como 'Producto no existe'
        res.status(404).json({ error: error.message });
    }
}));

module.exports = router;