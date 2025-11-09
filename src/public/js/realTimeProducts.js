const socket = io();

const form = document.getElementById('addProductForm');
const productList = document.getElementById('productList');
const errorMessage = document.getElementById('error-message');

const renderProducts = (products) => {
    productList.innerHTML = '';
    
    if (products.length === 0) {
        productList.innerHTML = `<p class="text-center col-span-full text-gray-500 p-8 border border-dashed border-gray-300 rounded-lg bg-white">
            No hay productos disponibles para mostrar. ¡Agrega uno arriba!
        </p>`;
        return;
    }

    products.forEach(product => {
        const productId = product._id; 
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-gray-100 p-5 rounded-2xl shadow-lg border border-gray-200';
        
        productCard.innerHTML = `
            <h4 class="text-xl font-extrabold text-indigo-700 mb-2">${product.title}</h4>
            <p class="text-sm text-gray-700 line-clamp-2">${product.description}</p>
            <hr class="my-3 border-gray-300">
            
            <div class="flex justify-between items-baseline mb-2">
                <p class="text-2xl font-black text-green-600">$${product.price}</p>
                <span class="text-xs font-medium text-green-500 bg-green-100 px-2 py-1 rounded-full">Disponible</span>
            </div>

            <p class="text-xs text-gray-500 space-y-1">
                <span class="block"><strong>Stock:</strong> ${product.stock} unidades</span>
                <span class="block"><strong>Categoría:</strong> ${product.category}</span>
                <span class="block"><strong>Código:</strong> ${product.code}</span>
                <span class="block text-gray-400 truncate"><strong>ID:</strong> <code class="bg-gray-200 p-1 rounded text-[10px]">${productId}</code></span>
            </p>

            <button onclick="deleteProduct('${productId}')" 
                    class="delete-btn mt-4 w-full bg-red-600 text-white text-base py-3 px-3 rounded-lg font-semibold hover:bg-red-700 transition duration-150 shadow-md">
                🗑️ Eliminar por Socket
            </button>
        `;
        productList.appendChild(productCard);
    });
};

form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMessage.classList.add('hidden'); 

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const code = form.code.value.trim();
    const price = Number(form.price.value);
    const stock = Number(form.stock.value);
    const category = form.category.value.trim();

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
        status: true, 
        thumbnails: [] 
    };

    socket.emit('newProduct', newProduct);
    form.reset();
});

const deleteProduct = (id) => {
    socket.emit('deleteProduct', id); 
};
window.deleteProduct = deleteProduct; 

socket.on('productsUpdate', (products) => {
    renderProducts(products); 
});

socket.on('productError', (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
});


socket.on('connect', () => {
    console.log("Conectado al servidor de sockets.");
});

socket.on('disconnect', () => {
    console.log("Desconectado del servidor de sockets.");
});