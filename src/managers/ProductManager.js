import ProductModel from '../models/Product.model.js'; // Importamos el modelo de Mongoose

/**
 * Manager diseñado para interactuar ÚNICAMENTE con la persistencia (MongoDB/Mongoose).
 * Toda la lógica de negocio (validaciones complejas, formateo) debe ir en el Router/Controller.
 */
class ProductManager {
    constructor() {
        console.log("🛠️ ProductManager inicializado con persistencia en MongoDB.");
        // Ya no necesitamos un constructor que reciba 'fileName' ni inicializar archivos.
    }

    /**
     * Obtiene todos los productos de la base de datos.
     * En este punto, no incluye la lógica de paginación o filtros, la cual irá
     * directamente en el router/controller.
     * @returns {Promise<Array>} Lista de productos.
     */
    async getProducts() {
        try {
            // Mongoose: Usa .find({}) para obtener todos los documentos
            const products = await ProductModel.find({}).lean(); 
            return products;
        } catch (error) {
            console.error("Error al obtener productos de MongoDB:", error.message);
            // Propagamos el error para que sea manejado en el router
            throw new Error('Error de persistencia al obtener productos.');
        }
    }

    /**
     * Obtiene un producto por su ID.
     * @param {string} id - El ID de MongoDB del producto.
     * @returns {Promise<Object|null>} El producto encontrado o null.
     */
    async getProductById(id) {
        try {
            // Mongoose: Usa .findById(id) para obtener un documento por su ID
            const product = await ProductModel.findById(id).lean();
            return product; // Mongoose devuelve null si no lo encuentra
        } catch (error) {
            console.error("Error al obtener producto por ID:", error.message);
            // Si el ID tiene un formato incorrecto (ej. no es un ObjectId), Mongoose lanza un error.
            return null; 
        }
    }

    /**
     * Agrega un nuevo producto a la base de datos.
     * @param {Object} productData - Datos del producto.
     * @returns {Promise<Object>} El nuevo producto creado.
     */
    async addProduct(productData) {
        // Validación de campos obligatorios (se mantiene aquí por simplicidad, aunque idealmente iría en el router)
        const { title, description, code, price, stock, category } = productData;
        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Todos los campos obligatorios deben estar presentes.");
        }

        try {
            // 1. Verificar unicidad del código
            const exists = await ProductModel.findOne({ code: code });
            if (exists) {
                throw new Error(`Ya existe un producto con el código ${code}.`);
            }

            // 2. Crear el producto en MongoDB
            const newProduct = await ProductModel.create(productData);
            return newProduct.toObject(); // Devuelve el objeto plano para usarlo
        } catch (error) {
            // Si es un error de validación de Mongoose o de unicidad, lo lanzamos.
            if (error.name === 'ValidationError' || error.message.includes('código')) {
                 throw error;
            }
            console.error("Error al crear producto en MongoDB:", error.message);
            throw new Error('Error de persistencia al agregar producto.');
        }
    }

    /**
     * Actualiza un producto existente por ID.
     * @param {string} id - ID del producto a actualizar.
     * @param {Object} newFields - Campos a actualizar.
     * @returns {Promise<Object|null>} El producto actualizado o null si no existe.
     */
    async updateProduct(id, newFields) {
        try {
            // Usamos findByIdAndUpdate con { new: true } para obtener el documento actualizado
            // runValidators: true asegura que las validaciones del esquema se ejecuten al actualizar
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                id, 
                { $set: newFields }, 
                { new: true, runValidators: true }
            ).lean();
            
            return updatedProduct;
        } catch (error) {
            console.error("Error al actualizar producto:", error.message);
            // Captura errores de validación (ej. precio negativo)
            if (error.name === 'ValidationError') {
                throw new Error(`Error de validación al actualizar: ${error.message}`);
            }
            throw new Error('Error de persistencia al actualizar producto.');
        }
    }

    /**
     * Elimina un producto por ID.
     * @param {string} id - ID del producto a eliminar.
     * @returns {Promise<boolean>} True si fue eliminado, false si no se encontró.
     */
    async deleteProduct(id) {
        try {
            // Mongoose: findByIdAndDelete devuelve el documento eliminado o null
            const result = await ProductModel.findByIdAndDelete(id);
            
            return result !== null;
        } catch (error) {
            console.error("Error al eliminar producto:", error.message);
            throw new Error('Error de persistencia al eliminar producto.');
        }
    }
}

export default ProductManager;

module.exports = ProductManager;