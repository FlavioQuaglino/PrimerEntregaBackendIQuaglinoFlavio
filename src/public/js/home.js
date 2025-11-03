// La lectura de ACTIVE_CART_ID debe ocurrir DENTRO del onload
let ACTIVE_CART_ID = null;

// Esperamos a que todo el contenido de la página (incluido el input) esté cargado.
window.onload = function() {
    const inputElement = document.getElementById('activeCartId');
    if (inputElement) {
        // Leemos el ID después de asegurarnos de que el elemento existe
        ACTIVE_CART_ID = inputElement.value;
        console.log("ID de Carrito Activo detectado:", ACTIVE_CART_ID);
        
        if (!ACTIVE_CART_ID) {
            console.error("ALERTA: El ID de carrito está vacío en la plantilla Handlebars.");
        }
    } else {
        console.error("ALERTA: No se encontró el elemento 'activeCartId' en el DOM.");
    }
};

/**
 * Función que realiza la llamada fetch (POST) a la API para agregar un producto al carrito.
 * @param {string} productId - ID del producto a agregar.
 */
function addToCart(productId) {
    // Verificamos ACTIVE_CART_ID aquí, justo antes de la llamada.
    if (!ACTIVE_CART_ID) {
        // Usamos el mensaje ajustado para dar más contexto
        alert("Error: ID de carrito no definido. Asegúrese de que el ID ('69092369c5a306f1d13ffac1') exista en la base de datos.");
        return;
    }

    // Endpoint: POST /api/carts/:cid/products/:pid
    const url = `/api/carts/${ACTIVE_CART_ID}/products/${productId}`;
    
    // Asumimos que siempre se agrega 1 unidad por defecto.
    const data = { quantity: 1 }; 

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            // Manejo de errores 4xx/5xx del servidor
            return response.json().then(err => { throw new Error(err.error || 'Error desconocido al añadir al carrito.') });
        }
        return response.json();
    })
    .then(data => {
        console.log('Producto agregado con éxito:', data);
        alert('✅ Producto añadido al carrito correctamente!');
    })
    .catch(error => {
        console.error('Hubo un error al añadir el producto al carrito:', error.message);
        alert(`❌ Error al añadir producto: ${error.message}`);
    });
}

// Exponer la función al ámbito global para que pueda ser llamada desde el onclick de Handlebars
window.addToCart = addToCart;