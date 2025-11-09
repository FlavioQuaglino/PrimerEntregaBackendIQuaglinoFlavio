/**
 * 
 * 
 * @param {string} message - 
 * @param {string} type - 
 */
function showNotification(message, type = 'success') {
    const box = document.getElementById('notificationBox');
    
    if (!box) {
        console.warn('El elemento #notificationBox no se encontró. Mensaje:', message);
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }
    
    box.textContent = message;
    box.className = ''; 
    box.classList.add(type);
    box.style.display = 'block';
    box.style.opacity = '1';

    setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => {
            box.style.display = 'none';
        }, 300);
    }, 3000);
}


/**
 * 
 * 
 * @param {string} productId - 
 */
async function addToCart(productId) {
    const url = `/api/carts/products/${productId}`;
    
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
            console.log('Producto agregado con éxito:', result);
            showNotification(`✅ ${result.message || 'Producto añadido al carrito correctamente!'}`, 'success');
        } else {
            console.error('Error del servidor:', result);
            const errorMessage = result.error || 'Error desconocido al añadir al carrito.';
            showNotification(`❌ Error: ${errorMessage}`, 'error');
        }

    } catch (error) {
        console.error('Hubo un error de conexión o fetch:', error.message);
        showNotification('❌ Error de conexión: El servidor no respondió. Verifica el estado del backend.', 'error');
    }
}

window.addToCart = addToCart;