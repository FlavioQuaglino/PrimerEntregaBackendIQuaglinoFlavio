import ProductModel from '../models/Product.model.js'; 

/**
 * Manager diseñado para interactuar ÚNICAMENTE con la persistencia (MongoDB/Mongoose).
 */
class ProductManager {
    constructor() {
        console.log("🛠️ ProductManager inicializado con persistencia en MongoDB.");
    }

    /**
     * Obtiene productos con paginación, filtros y ordenamiento.
     * @param {Object} criteria - Objeto de criterios de filtrado (e.g., { category: 'Libros' }).
     * @param {Object} options - Opciones de paginación y ordenamiento (limit, page, sort).
     * @returns {Promise<Object>} Objeto con datos de paginación (docs, totalPages, page, etc.).
     */
    async getProducts(criteria = {}, options = {}) {
        try {
            // 1. Configurar opciones finales para paginate
            const finalOptions = {
                ...options,
                lean: true // Fundamental para obtener objetos JS planos más rápidos
            };

            // 2. Ejecutar la paginación de Mongoose
            // ProductModel.paginate(criteria, finalOptions) devuelve el objeto completo
            const productsData = await ProductModel.paginate(criteria, finalOptions);
            
            // Este objeto ya contiene: { docs, totalPages, page, hasPrevPage, hasNextPage, etc. }
            return productsData;
            
        } catch (error) {
            console.error('Error al obtener productos paginados:', error.message);
            throw new Error('No se pudieron obtener los productos de la base de datos.');
        }
    }

    /**
     * Obtiene un producto por su ID.
     * @param {string} id - El ID de MongoDB del producto.
     * @returns {Promise<Object|null>} El producto encontrado o null.
     */
    async getProductById(id) {
        try {
            const product = await ProductModel.findById(id).lean();
            return product;
        } catch (error) {
            console.error("Error al obtener producto por ID:", error.message);
            // Si el error es CastError, el router lo manejará. Aquí solo devolvemos nulo o lanzamos la excepción.
            throw error; 
        }
    }

    /**
     * Agrega un nuevo producto a la base de datos.
     * @param {Object} productData - Datos del producto.
     * @returns {Promise<Object>} El nuevo producto creado.
     */
    async addProduct(productData) {
        // La validación de campos obligatorios DEBERÍA estar en el esquema, pero se mantiene aquí temporalmente
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
            return newProduct.toObject();
        } catch (error) {
            // Si es un error de validación de Mongoose, lo lanzamos para que el router lo capture.
            if (error.name === 'ValidationError') {
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
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                id, 
                { $set: newFields }, 
                { new: true, runValidators: true }
            ).lean();
            
            return updatedProduct;
        } catch (error) {
            console.error("Error al actualizar producto:", error.message);
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
            const result = await ProductModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            console.error("Error al eliminar producto:", error.message);
            throw new Error('Error de persistencia al eliminar producto.');
        }
    }
}

export default ProductManager;
