const socket = io();

const form = document.getElementById('addProductForm');
const productList = document.getElementById('productList');
const errorMessage = document.getElementById('error-message');

// Función para renderizar todos los productos usando la estructura de tarjeta del Canvas
const renderProducts = (products) => {
    productList.innerHTML = '';
    
    if (products.length === 0) {
        productList.innerHTML = `<p class="col-span-full text-center text-gray-500">
            No hay productos en tiempo real. ¡Agrega uno!
        </p>`;
        return;
    }

    products.forEach(product => {
        // Usamos el _id de MongoDB
        const productId = product._id; 
        
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-xl shadow-md overflow-hidden p-4 border border-gray-100';
        productCard.innerHTML = `
            <h4 class="text-xl font-bold text-gray-900 mb-2">${product.title}</h4>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
            
            <div class="flex justify-between items-center mb-3">
                <span class="text-2xl font-extrabold text-green-600">$${product.price}</span>
            </div>

            <div class="text-xs text-gray-500 space-y-1">
                <p><strong>Código:</strong> ${product.code}</p>
                <p><strong>Stock:</strong> ${product.stock} unidades</p>
                <p><strong>Categoría:</strong> ${product.category}</p>
                <p><strong>ID:</strong> <code class="bg-gray-200 p-1 rounded">${productId}</code></p>
            </div>

            <button onclick="deleteProduct('${productId}')" 
                    class="mt-4 w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition duration-150">
                Eliminar por Socket
            </button>
        `;
        productList.appendChild(productCard);
    });
};


// ------------------------------------
// MANEJO DEL FORMULARIO DE AGREGAR
// ------------------------------------
form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMessage.classList.add('hidden'); // Ocultar errores anteriores

    // Obtener y validar datos
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const code = form.code.value.trim();
    const price = Number(form.price.value);
    const stock = Number(form.stock.value);
    const category = form.category.value.trim();

    // Validación básica en el cliente
    if (!title || !description || !code || price <= 0 || stock < 0 || !category) {
        errorMessage.textContent = "Todos los campos (Título, Descripción, Código, Precio > 0, Stock, Categoría) son obligatorios.";
        errorMessage.classList.remove('hidden');
        return;
    }

    const newProduct = {
        title,
        description,
        code,
        price,
        stock,
        category,
        status: true, // Siempre true por defecto al crearse
        thumbnails: [] // Array vacío por defecto
    };

    socket.emit('newProduct', newProduct);
    form.reset();
});

// ------------------------------------
// MANEJO DE ELIMINAR
// ------------------------------------
const deleteProduct = (id) => {
    // Usamos el id de MongoDB
    socket.emit('deleteProduct', id); 
};
window.deleteProduct = deleteProduct; // Exponer la función globalmente para el onclick

// ------------------------------------
// EVENTOS DE SOCKET.IO
// ------------------------------------
socket.on('productsUpdate', (products) => {
    // La función renderProducts se encarga de vaciar y volver a llenar la lista
    renderProducts(products); 
});

// Capturar errores del lado del servidor (e.g., código duplicado)
socket.on('productError', (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
});


socket.on('connect', () => {
    console.log("Conectado al servidor de sockets.");
    // Pedir la lista inicial al conectarse
    socket.emit('getInitialProducts');
});

socket.on('disconnect', () => {
    console.log("Desconectado del servidor de sockets.");
});
