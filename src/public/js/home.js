/**
 * Lógica del Frontend para la vista de productos (home.handlebars).
 * Centraliza la función addToCart y el sistema de notificaciones.
 * * IMPORTANTE: Ya NO se requiere el ID del carrito en el frontend.
 * El backend (middleware) debe tomar el ID del carrito de la cookie.
 */

// Ya no necesitamos una variable global para ACTIVE_CART_ID ni window.onload para leerla.

/**
 * Función para mostrar mensajes de notificación (éxito o error).
 * Esta función depende de que exista el elemento <div id="notificationBox"> en home.handlebars
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - 'success' o 'error'.
 */
function showNotification(message, type = 'success') {
    const box = document.getElementById('notificationBox');
    
    if (!box) {
        console.warn('El elemento #notificationBox no se encontró. Mensaje:', message);
        // Fallback simple si el elemento no existe (aunque no recomendado)
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }
    
    box.textContent = message;
    box.className = ''; 
    box.classList.add(type);
    box.style.display = 'block';
    box.style.opacity = '1';

    // Ocultar después de 3 segundos
    setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => {
            box.style.display = 'none';
        }, 300);
    }, 3000);
}


/**
 * Función que realiza la llamada fetch (POST) a la API para agregar un producto al carrito.
 * Utiliza la ruta simplificada para que el middleware se encargue del Cart ID.
 * @param {string} productId - ID del producto a agregar.
 */
async function addToCart(productId) {
    // Endpoint: POST /api/carts/products/:pid
    // El Cart ID (cid) se gestiona en el backend (middleware) usando la cookie.
    const url = `/api/carts/products/${productId}`;
    
    // Asumimos que siempre se agrega 1 unidad por defecto.
    const data = { quantity: 1 }; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Manejo de respuesta exitosa (código 2xx)
            console.log('Producto agregado con éxito:', result);
            showNotification(`✅ ${result.message || 'Producto añadido al carrito correctamente!'}`, 'success');
        } else {
            // Manejo de errores 4xx/5xx del servidor
            console.error('Error del servidor:', result);
            const errorMessage = result.error || 'Error desconocido al añadir al carrito.';
            showNotification(`❌ Error: ${errorMessage}`, 'error');
        }

    } catch (error) {
        // Captura errores de red (Failed to fetch). Este es el error "Error de conexión" que veías.
        console.error('Hubo un error de conexión o fetch:', error.message);
        showNotification('❌ Error de conexión: El servidor no respondió. Verifica el estado del backend.', 'error');
    }
}

// Exponer la función al ámbito global para que pueda ser llamada desde el onclick de Handlebars
window.addToCart = addToCart;