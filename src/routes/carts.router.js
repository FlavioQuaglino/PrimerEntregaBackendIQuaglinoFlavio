
const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); 
const CartManager = require('../managers/CartManager');
const productManager = new ProductManager('products.json');
const cartManager = new CartManager('carts.json', productManager); 
const router = Router();
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/', asyncHandler(async (req, res) => {
    const newCart = await cartManager.createCart();
    res.status(201).json({ message: 'Carrito creado exitosamente', cart: newCart });
}));


router.get('/:cid', asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const productsInCart = await cartManager.getCartById(cid);

    if (!productsInCart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
    }


    res.json(productsInCart);
}));

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