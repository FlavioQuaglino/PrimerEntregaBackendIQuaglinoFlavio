import mongoose from 'mongoose';
// ⚠️ PASO 1 CRÍTICO: Necesitas importar mongoose-paginate-v2
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({ // <-- Renombrado a minúscula
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // 'unique: true' para validar códigos
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    thumbnails: { type: [String], default: [] }, // Array de strings
    status: { type: Boolean, default: true }
}, {
    // Esto asegura que se incluyan createdAt y updatedAt
    timestamps: true 
});

// ⚠️ PASO 2 CRÍTICO: Aplicar el plugin de paginación al esquema
productSchema.plugin(mongoosePaginate); 

// Crear el modelo
// Usamos el nombre 'products' en minúscula para la colección (Mongoose lo pluraliza automáticamente)
export const ProductModel = mongoose.model('products', productSchema); 

// Exportación por defecto para mantener la compatibilidad con el ProductManager
export default ProductModel;