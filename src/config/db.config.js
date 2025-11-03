import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carga las variables de entorno del archivo .env
dotenv.config();

// Obtiene la URL de conexión de la variable de entorno
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Función para conectar a la base de datos MongoDB.
 */
const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error("🔴 ERROR: La variable de entorno MONGODB_URI no está definida.");
        // Termina el proceso si no hay URI
        process.exit(1);
    }
    
    try {
        await mongoose.connect(MONGODB_URI, {
            // useNewUrlParser y useUnifiedTopology ya no son necesarios
        });
        console.log('🟢 MongoDB conectado exitosamente.');
    } catch (error) {
        console.error('🔴 Error de conexión a MongoDB:', error.message);
        // Termina el proceso si la conexión falla
        process.exit(1); 
    }
};

export default connectDB;