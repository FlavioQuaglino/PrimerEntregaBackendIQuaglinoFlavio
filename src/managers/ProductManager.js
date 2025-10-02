const fs = require('fs/promises');
const path = require('path');

class ProductManager {
    constructor(fileName) {
        this.path = path.join(process.cwd(), fileName);
        this.products = []; // Inicializado como array
        this.initializeFile();
    }

    async initializeFile() {
        try {
            await fs.access(this.path);
        } catch (error) {
            await fs.writeFile(this.path, '[]', 'utf-8');
        }
    }

    async #readProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            
            if (!data.trim()) { 
                this.products = [];
                return this.products;
            }
            
            this.products = JSON.parse(data);
            return this.products;
        } catch (error) {
            // Si hay error (ej: archivo mal formateado o JSON inválido), aseguramos un array vacío.
            console.error('Error al leer o parsear productos:', error.message);
            this.products = []; // <-- ¡CORRECCIÓN! Aseguramos que sea un array
            return []; 
        }
    }
    
    async #saveProducts() {
        try {
            await fs.writeFile(this.path, JSON.stringify(this.products, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error al guardar productos:', error.message);
        }
    }

    #generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `p-${timestamp}-${random}`;
    }
    async getProducts() {
        return this.#readProducts();
    }

    async getProductById(id) {
        await this.#readProducts();
        const product = this.products.find(p => p.id === id);
        return product || null;
    }

    async addProduct(productData) {
        await this.#readProducts(); 

        const { title, description, code, price, stock, category, thumbnails = [] } = productData;

        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Todos los campos obligatorios deben estar presentes.");
        }
        
        if (this.products.some(p => p.code === code)) {
            throw new Error(`Ya existe un producto con el código ${code}.`);
        }
        // ... [Resto del código de addProduct] ...
        
        const newProduct = {
            id: this.#generateId(),
            title,
            description,
            code,
            price: Number(price),
            status: true,
            stock: Number(stock),
            category,
            thumbnails: Array.isArray(thumbnails) ? thumbnails : [thumbnails],
        };

        this.products.push(newProduct);
        await this.#saveProducts();
        return newProduct;
    }

    async updateProduct(id, newFields) {
        await this.#readProducts();
        const index = this.products.findIndex(p => p.id === id);

        if (index === -1) {
            return null;
        }

        const updatedProduct = { ...this.products[index] };

        for (const key in newFields) {
            if (key !== 'id') { 
                if (key === 'price') updatedProduct.price = Number(newFields[key]);
                else if (key === 'stock') updatedProduct.stock = Number(newFields[key]);
                else if (key === 'status') updatedProduct.status = Boolean(newFields[key]);
                else updatedProduct[key] = newFields[key];
            }
        }
        
        this.products[index] = updatedProduct;
        await this.#saveProducts();
        return updatedProduct;
    }

    async deleteProduct(id) {
        await this.#readProducts();
        const initialLength = this.products.length;
        
        this.products = this.products.filter(p => p.id !== id);

        if (this.products.length < initialLength) {
            await this.#saveProducts();
            return true;
        }
        
        return false;
    }
}

module.exports = ProductManager;