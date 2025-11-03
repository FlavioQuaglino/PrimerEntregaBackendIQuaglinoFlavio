import CartModel from '../models/Cart.model.js';
import ProductModel from '../models/Product.model.js'; // Necesario para verificar existencia del producto
import mongoose from 'mongoose';

/**
 * Manager diseñado para interactuar ÚNICAMENTE con la persistencia del Carrito (MongoDB/Mongoose).
 */
class CartManager {
    constructor() {
        console.log("🛠️ CartManager inicializado con persistencia en MongoDB.");
        // Ya no necesitamos un ProductManager inyectado aquí, ni manejo de archivos.
        // La validación de existencia de producto se hará directamente con ProductModel.
    }

    // --- Métodos CRUD BÁSICOS ---

    /**
     * POST /api/carts/ - Crea un nuevo carrito vacío.
     * @returns {Promise<Object>} El nuevo carrito creado.
     */
    async createCart() {
        try {
            // Mongoose: Crea un nuevo documento de carrito con un array de products vacío por defecto.
            const newCart = await CartModel.create({});
            return newCart.toObject();
        } catch (error) {
            console.error("Error al crear carrito:", error.message);
            throw new Error('Error de persistencia al crear el carrito.');
        }
    }

    /**
     * GET /api/carts/:cid - Obtiene un carrito por ID y POPULA los productos.
     * Consigna: Modificar la ruta /:cid para que al traer todos los productos, 
     * los traiga completos mediante un "populate".
     * @param {string} cartId - ID de MongoDB del carrito.
     * @returns {Promise<Object|null>} El carrito con los productos populados.
     */
    async getCartById(cartId) {
        try {
            // Mongoose: findById(cartId) y luego .populate('products.product')
            const cart = await CartModel.findById(cartId)
                .populate('products.product') // Ejecuta el populate en el campo 'product' dentro del array 'products'
                .lean(); 

            return cart; 
        } catch (error) {
            console.error("Error al obtener carrito:", error.message);
            // Si el ID es inválido, Mongoose puede lanzar un error, lo manejamos devolviendo null o relanzando.
            if (error.name === 'CastError') {
                 return null;
            }
            throw new Error('Error de persistencia al obtener el carrito.');
        }
    }

    // --- Métodos de Gestión de Productos en Carrito ---
    
    /**
     * POST /api/carts/:cid/product/:pid - Agrega o incrementa la cantidad de un producto.
     * @param {string} cartId - ID del carrito.
     * @param {string} productId - ID del producto a agregar.
     * @returns {Promise<Object>} El carrito actualizado.
     */
    async addProductToCart(cartId, productId) {
        // Validación: Asegurarse de que el producto exista ANTES de intentar agregarlo
        const productExists = await ProductModel.findById(productId);
        if (!productExists) {
            throw new Error(`Producto con ID ${productId} no existe.`);
        }

        try {
            // Usamos findOneAndUpdate para una operación atómica: 
            // 1. Intenta incrementar la cantidad si el producto ya existe.
            const updatedCart = await CartModel.findOneAndUpdate(
                { _id: cartId, 'products.product': productId },
                { $inc: { 'products.$.quantity': 1 } },
                { new: true, runValidators: true }
            );

            if (updatedCart) {
                return updatedCart.toObject();
            }

            // 2. Si el producto no existe, lo agrega al array.
            const newCart = await CartModel.findByIdAndUpdate(
                cartId,
                { $push: { products: { product: productId, quantity: 1 } } },
                { new: true, runValidators: true }
            );
            
            if (!newCart) {
                return null; // Carrito no encontrado
            }
            return newCart.toObject();

        } catch (error) {
            console.error("Error al agregar producto al carrito:", error.message);
            throw new Error('Error de persistencia al agregar producto al carrito.');
        }
    }

    // --- Nuevos Endpoints Requeridos para la Entrega Final ---

    /**
     * DELETE api/carts/:cid/products/:pid - Elimina el producto seleccionado del carrito.
     * @param {string} cartId 
     * @param {string} productId 
     * @returns {Promise<Object|null>} El carrito actualizado o null si no se encuentra.
     */
    async removeProductFromCart(cartId, productId) {
        try {
            // $pull elimina un elemento del array 'products' que cumpla la condición (product: productId)
            const updatedCart = await CartModel.findByIdAndUpdate(
                cartId,
                { $pull: { products: { product: productId } } },
                { new: true }
            ).lean();

            return updatedCart;
        } catch (error) {
            console.error("Error al eliminar producto del carrito:", error.message);
            throw new Error('Error de persistencia al eliminar producto del carrito.');
        }
    }

    /**
     * PUT api/carts/:cid - Actualiza todos los productos del carrito con un arreglo de productos.
     * El nuevoProducts debe ser un arreglo con el formato: [{ product: id, quantity: number }, ...]
     * @param {string} cartId 
     * @param {Array<Object>} newProducts - Arreglo de productos con ID y cantidad.
     * @returns {Promise<Object|null>} El carrito actualizado.
     */
    async updateCartProducts(cartId, newProducts) {
        // Nota: Idealmente, aquí se debería validar que todos los IDs en newProducts existan.
        try {
            // $set reemplaza completamente el array 'products'
            const updatedCart = await CartModel.findByIdAndUpdate(
                cartId,
                { $set: { products: newProducts } },
                { new: true, runValidators: true }
            ).lean();

            return updatedCart;
        } catch (error) {
            console.error("Error al reemplazar productos del carrito:", error.message);
            throw new Error('Error de persistencia al actualizar los productos del carrito.');
        }
    }

    /**
     * PUT api/carts/:cid/products/:pid - Actualiza SÓLO la cantidad de ejemplares de un producto.
     * @param {string} cartId 
     * @param {string} productId 
     * @param {number} quantity - Nueva cantidad.
     * @returns {Promise<Object|null>} El carrito actualizado.
     */
    async updateProductQuantity(cartId, productId, quantity) {
        try {
            if (typeof quantity !== 'number' || quantity < 0) {
                throw new Error("La cantidad debe ser un número positivo.");
            }
            
            // Operador $set en conjunción con el operador posicional $
            const updatedCart = await CartModel.findOneAndUpdate(
                { _id: cartId, 'products.product': productId },
                { $set: { 'products.$.quantity': quantity } },
                { new: true }
            ).lean();
            
            // Si quantity es 0, podemos aprovechar para eliminarlo del carrito.
            if (quantity === 0) {
                 await this.removeProductFromCart(cartId, productId);
            }

            return updatedCart;
        } catch (error) {
            console.error("Error al actualizar la cantidad del producto:", error.message);
            throw new Error(`Error de persistencia: ${error.message}`);
        }
    }

    /**
     * DELETE api/carts/:cid - Elimina todos los productos del carrito (lo vacía).
     * @param {string} cartId 
     * @returns {Promise<Object|null>} El carrito vacío.
     */
    async clearCart(cartId) {
        try {
            // $set: { products: [] } reemplaza el array de productos por uno vacío
            const updatedCart = await CartModel.findByIdAndUpdate(
                cartId,
                { $set: { products: [] } },
                { new: true }
            ).lean();
            
            return updatedCart;
        } catch (error) {
            console.error("Error al vaciar el carrito:", error.message);
            throw new Error('Error de persistencia al vaciar el carrito.');
        }
    }
}

export default CartManager;