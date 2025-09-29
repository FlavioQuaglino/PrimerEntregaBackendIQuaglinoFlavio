// src/managers/ProductManager.js

const fs = require('fs/promises');
const path = require('path');

class ProductManager {
    constructor(fileName) {
        this.path = path.join(process.cwd(), fileName);
        this.products = [];
        this.initializeFile();
    }

    /**
     * Asegura que el archivo exista e inicializa la lista de productos.
     * Si no existe, lo crea con un array vacío.
     */
    async initializeFile() {
        try {
            await fs.access(this.path);
        } catch (error) {
            // El archivo no existe, lo creamos
            await fs.writeFile(this.path, '[]', 'utf-8');
        }
    }

    /**
     * Lee el archivo y parsea su contenido.
     * @returns {Promise<Array>} Lista de productos.
     */
    async #readProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            this.products = JSON.parse(data);
            return this.products;
        } catch (error) {
            console.error('Error al leer productos:', error.message);
            return []; // Retorna un array vacío si hay error de lectura/parseo
        }
    }

    /**
     * Escribe el array actual de productos en el archivo.
     */
    async #saveProducts() {
        try {
            await fs.writeFile(this.path, JSON.stringify(this.products, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error al guardar productos:', error.message);
        }
    }

    /**
     * Genera un ID alfanumérico único.
     * Una solución simple y robusta es usar un ID universal único (UUID).
     * Nota: Para esta entrega, una alternativa más sencilla podría ser un contador o un timestamp,
     * pero UUID es estándar en la industria. Aquí usaremos una cadena simple por simplicidad.
     */
    #generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `${timestamp}-${random}`;
    }

    // --- MÉTODOS REQUERIDOS POR LA API ---

    /**
     * GET /api/products/
     * @returns {Promise<Array>} Lista todos los productos.
     */
    async getProducts() {
        return this.#readProducts();
    }

    /**
     * GET /api/products/:pid
     * @param {string} id - ID del producto.
     * @returns {Promise<Object|null>} El producto o null si no existe.
     */
    async getProductById(id) {
        await this.#readProducts();
        const product = this.products.find(p => p.id === id);
        return product || null;
    }

    /**
     * POST /api/products/
     * Agrega un nuevo producto.
     * @param {Object} productData - Datos del producto (title, description, code, price, stock, category).
     * @returns {Promise<Object|Error>} El nuevo producto o un error.
     */
    async addProduct(productData) {
        await this.#readProducts();

        const { title, description, code, price, stock, category, thumbnails = [] } = productData;

        // Validar que todos los campos obligatorios existan
        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Todos los campos (title, description, code, price, stock, category) son obligatorios.");
        }
        
        // Validar que el código no se repita
        if (this.products.some(p => p.code === code)) {
            throw new Error(`Ya existe un producto con el código ${code}.`);
        }

        const newProduct = {
            id: this.#generateId(), // Autogenerado
            title,
            description,
            code,
            price: Number(price),
            status: true, // Por defecto es true
            stock: Number(stock),
            category,
            thumbnails: Array.isArray(thumbnails) ? thumbnails : [thumbnails], // Asegura que sea un array
        };

        this.products.push(newProduct);
        await this.#saveProducts();
        return newProduct;
    }

    /**
     * PUT /api/products/:pid
     * Actualiza un producto por ID. No permite actualizar el ID.
     * @param {string} id - ID del producto a actualizar.
     * @param {Object} newFields - Campos a actualizar.
     * @returns {Promise<Object|null>} El producto actualizado o null si no existe.
     */
    async updateProduct(id, newFields) {
        await this.#readProducts();
        const index = this.products.findIndex(p => p.id === id);

        if (index === -1) {
            return null; // Producto no encontrado
        }

        const productToUpdate = this.products[index];
        const updatedProduct = { ...productToUpdate };

        // Iterar sobre los campos para actualizar. Se ignora el campo 'id'.
        for (const key in newFields) {
            if (key !== 'id' && updatedProduct.hasOwnProperty(key)) {
                updatedProduct[key] = newFields[key];
            }
        }
        
        // Asegurar que price y stock sean Numbers si se envían
        if (newFields.price) updatedProduct.price = Number(newFields.price);
        if (newFields.stock) updatedProduct.stock = Number(newFields.stock);
        if (newFields.status) updatedProduct.status = Boolean(newFields.status);
        if (newFields.thumbnails && !Array.isArray(newFields.thumbnails)) {
             updatedProduct.thumbnails = [newFields.thumbnails];
        }


        this.products[index] = updatedProduct;
        await this.#saveProducts();
        return updatedProduct;
    }

    /**
     * DELETE /api/products/:pid
     * Elimina un producto por ID.
     * @param {string} id - ID del producto a eliminar.
     * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
     */
    async deleteProduct(id) {
        await this.#readProducts();
        const initialLength = this.products.length;
        
        this.products = this.products.filter(p => p.id !== id);

        if (this.products.length < initialLength) {
            await this.#saveProducts();
            return true; // Se eliminó
        }
        
        return false; // No se encontró el ID
    }
}

module.exports = ProductManager;