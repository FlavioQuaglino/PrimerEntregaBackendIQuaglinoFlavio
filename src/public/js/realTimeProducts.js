const socket = io(); // Conecta el cliente al servidor de sockets

const form = document.getElementById('addProductForm');
const productList = document.getElementById('productList');

// --- 1. ENVIAR DATA (Crear/Eliminar) ---

// Manejar el envío del formulario para crear un producto
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener los datos del formulario, ASIGNANDO VALORES SEGUROS/DEFAULT
    const newProduct = {
        title: document.getElementById('title').value,
        price: Number(document.getElementById('price').value),
        
        // Asumiendo que estos campos están en el HTML. Si no lo están,
        // necesitamos un valor por defecto para que el Manager no falle:
        description: document.getElementById('description').value || 'Producto Socket',
        code: document.getElementById('code').value || `CODE-${Date.now()}`, // Usar un valor único si no existe
        stock: Number(document.getElementById('stock').value) || 10,
        
        // ¡LA CORRECCIÓN CLAVE! El Manager requiere este campo.
        category: document.getElementById('category')?.value || 'General', 
    };

    // Emitir el evento 'newProduct' al servidor con los datos
    socket.emit('newProduct', newProduct); 

    form.reset();
});

// Función auxiliar para emitir la eliminación de un producto
const deleteProduct = (id) => {
    // Emitir el evento 'deleteProduct' al servidor con el ID
    socket.emit('deleteProduct', id);
};


// --- 2. RECIBIR DATA (Actualización) ---

// Escuchar el evento 'productsUpdate' que el servidor emite
socket.on('productsUpdate', (products) => {
    // Limpiar la lista actual
    productList.innerHTML = ''; 

    // Renderizar la lista actualizada
    products.forEach(product => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${product.title}</strong> - $${product.price} (ID: ${product.id}) 
            <button onclick="deleteProduct('${product.id}')">Eliminar</button>
        `;
        productList.appendChild(li);
    });
});

// ¡IMPORTANTE! Exponer la función deleteProduct al scope global para que el botón la encuentre.
window.deleteProduct = deleteProduct;

// Al conectarse, solicitamos la lista inicial
socket.on('connect', () => {
    socket.emit('getInitialProducts');
});