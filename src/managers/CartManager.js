// src/managers/CartManager.js

const fs = require('fs/promises');
const path = require('path');

class CartManager {
    constructor(fileName, productManager) {
        this.path = path.join(process.cwd(), fileName);
        this.carts = [];
        this.productManager = productManager; // Necesitamos el ProductManager
        this.initializeFile();
    }

    /**
     * Asegura que el archivo de carritos exista.
     */
    async initializeFile() {
        try {
            await fs.access(this.path);
        } catch (error) {
            await fs.writeFile(this.path, '[]', 'utf-8');
        }
    }

    /**
     * Lee el archivo y parsea su contenido.
     */
    async #readCarts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            this.carts = JSON.parse(data);
            return this.carts;
        } catch (error) {
            console.error('Error al leer carritos:', error.message);
            return [];
        }
    }

    /**
     * Escribe el array actual de carritos en el archivo.
     */
    async #saveCarts() {
        try {
            await fs.writeFile(this.path, JSON.stringify(this.carts, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error al guardar carritos:', error.message);
        }
    }

    /**
     * Genera un ID alfanumérico único para el carrito.
     */
    #generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `c-${timestamp}-${random}`;
    }

    // --- MÉTODOS REQUERIDOS POR LA API ---

    /**
     * POST /api/carts/
     * Crea un nuevo carrito.
     * @returns {Promise<Object>} El nuevo carrito.
     */
    async createCart() {
        await this.#readCarts();
        
        const newCart = {
            id: this.#generateId(), // Autogenerado
            products: [] // Array de productos inicializado vacío
        };

        this.carts.push(newCart);
        await this.#saveCarts();
        return newCart;
    }

    /**
     * GET /api/carts/:cid
     * Lista los productos de un carrito.
     * @param {string} cartId - ID del carrito.
     * @returns {Promise<Array|null>} El array de productos del carrito o null si no existe.
     */
    async getCartById(cartId) {
        await this.#readCarts();
        const cart = this.carts.find(c => c.id === cartId);
        
        // El requerimiento pide listar los productos, así que devolvemos el array 'products'
        return cart ? cart.products : null;
    }

    /**
     * POST /api/carts/:cid/product/:pid
     * Agrega un producto a un carrito o incrementa su cantidad.
     * @param {string} cartId - ID del carrito.
     * @param {string} productId - ID del producto.
     * @returns {Promise<Object|null|Error>} El carrito actualizado o null/Error.
     */
    async addProductToCart(cartId, productId) {
        await this.#readCarts();
        const cartIndex = this.carts.findIndex(c => c.id === cartId);
        
        if (cartIndex === -1) {
            return null; // Carrito no encontrado
        }

        // 1. Verificar si el producto existe usando ProductManager
        const productExists = await this.productManager.getProductById(productId);
        if (!productExists) {
            throw new Error(`Producto con ID ${productId} no existe.`);
        }

        const cart = this.carts[cartIndex];
        const productInCartIndex = cart.products.findIndex(item => item.product === productId);

        if (productInCartIndex > -1) {
            // 2. El producto ya existe: incrementar quantity
            cart.products[productInCartIndex].quantity += 1;
        } else {
            // 3. El producto es nuevo: agregarlo con quantity: 1
            cart.products.push({
                product: productId, // Solo el ID del producto
                quantity: 1         // Se agrega de uno en uno
            });
        }

        await this.#saveCarts();
        return cart;
    }
}

module.exports = CartManager;