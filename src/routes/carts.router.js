import { Router } from 'express';
// Importamos el Manager que ya no necesita argumentos de archivo
import CartManager from '../managers/CartManager.js'; 

const cartManager = new CartManager(); 
const router = Router();

// Middleware para manejar errores asíncronos de forma centralizada
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ===============================================
// POST /api/carts/ - Crear Carrito
// ===============================================
router.post('/', asyncHandler(async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json({ status: 'success', message: 'Carrito creado exitosamente', payload: newCart });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Error al crear el carrito: ' + error.message });
    }
}));


// ===============================================
// GET /api/carts/:cid - Obtener Carrito (con POPULATE)
// ===============================================
router.get('/:cid', asyncHandler(async (req, res) => {
    const { cid } = req.params;
    
    try {
        // Este método en el Manager ya incluye .populate('products.product')
        const cart = await cartManager.getCartById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', error: `Carrito con ID ${cid} no encontrado.` });
        }

        // El payload ahora contiene los datos del producto completos gracias a populate
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        // Mongoose CastError si el ID es inválido
        res.status(400).json({ status: 'error', error: 'ID de carrito inválido: ' + error.message });
    }
}));


// ===============================================
// POST /api/carts/:cid/product/:pid - Agregar/Incrementar Producto
// ===============================================
router.post('/:cid/product/:pid', asyncHandler(async (req, res) => {
    const { cid, pid } = req.params;
    
    try {
        const updatedCart = await cartManager.addProductToCart(cid, pid);
        
        if (!updatedCart) {
            return res.status(404).json({ status: 'error', error: 'Carrito no encontrado para agregar producto' });
        }
        
        res.json({ status: 'success', message: 'Producto agregado/incrementado en el carrito', payload: updatedCart });
    } catch (error) {
        // Captura error si el producto no existe o ID es inválido
        res.status(400).json({ status: 'error', error: error.message });
    }
}));


// ===============================================
// PUT /api/carts/:cid - Actualizar TODOS los productos del carrito (con Array)
// ===============================================
// Consigna: deberá actualizar todos los productos del carrito con un arreglo de productos.
router.put('/:cid', asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const productsArray = req.body.products; // Espera un body como { products: [{ product: id, quantity: num }] }

    if (!Array.isArray(productsArray)) {
        return res.status(400).json({ status: 'error', error: 'El cuerpo de la solicitud debe contener un arreglo de productos.' });
    }

    try {
        const updatedCart = await cartManager.updateCartProducts(cid, productsArray);
        
        if (!updatedCart) {
            return res.status(404).json({ status: 'error', error: `Carrito con ID ${cid} no encontrado.` });
        }

        res.json({ status: 'success', message: 'Productos del carrito actualizados completamente.', payload: updatedCart });
    } catch (error) {
        res.status(400).json({ status: 'error', error: 'Error al actualizar los productos del carrito: ' + error.message });
    }
}));


// ===============================================
// PUT /api/carts/:cid/products/:pid - Actualizar SÓLO la cantidad
// ===============================================
// Consigna: deberá poder actualizar SÓLO la cantidad de ejemplares del producto por cualquier cantidad pasada desde req.body
router.put('/:cid/products/:pid', asyncHandler(async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body; 

    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ status: 'error', error: 'Se requiere un valor numérico positivo para "quantity".' });
    }

    try {
        const updatedCart = await cartManager.updateProductQuantity(cid, pid, quantity);

        if (!updatedCart) {
             // Si Mongoose no encuentra el carrito/producto, o si el producto no existe dentro del carrito
             return res.status(404).json({ status: 'error', error: `Carrito o producto no encontrado en el carrito.` });
        }
        
        res.json({ status: 'success', message: `Cantidad de producto ${pid} actualizada a ${quantity}.`, payload: updatedCart });
    } catch (error) {
        res.status(400).json({ status: 'error', error: 'Error al actualizar la cantidad: ' + error.message });
    }
}));


// ===============================================
// DELETE /api/carts/:cid/products/:pid - Eliminar producto del carrito
// ===============================================
// Consigna: deberá eliminar del carrito el producto seleccionado.
router.delete('/:cid/products/:pid', asyncHandler(async (req, res) => {
    const { cid, pid } = req.params;

    try {
        const updatedCart = await cartManager.removeProductFromCart(cid, pid);

        if (!updatedCart) {
            return res.status(404).json({ status: 'error', error: `Carrito con ID ${cid} no encontrado.` });
        }

        res.json({ status: 'success', message: `Producto ${pid} eliminado del carrito ${cid}.`, payload: updatedCart });
    } catch (error) {
        res.status(400).json({ status: 'error', error: 'Error al eliminar producto del carrito: ' + error.message });
    }
}));


// ===============================================
// DELETE /api/carts/:cid - Eliminar TODOS los productos del carrito (Vaciar)
// ===============================================
// Consigna: deberá eliminar todos los productos del carrito.
router.delete('/:cid', asyncHandler(async (req, res) => {
    const { cid } = req.params;

    try {
        const updatedCart = await cartManager.clearCart(cid);

        if (!updatedCart) {
            return res.status(404).json({ status: 'error', error: `Carrito con ID ${cid} no encontrado.` });
        }

        res.json({ status: 'success', message: `Carrito ${cid} vaciado exitosamente.`, payload: updatedCart });
    } catch (error) {
        res.status(400).json({ status: 'error', error: 'Error al vaciar el carrito: ' + error.message });
    }
}));

export default router;