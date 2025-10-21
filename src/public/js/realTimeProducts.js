const socket = io(); 

const form = document.getElementById('addProductForm');
const productList = document.getElementById('productList');

const generateUniqueCode = () => {
    return `WS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};


form.addEventListener('submit', (e) => {
    e.preventDefault();
    

    const titleInput = document.getElementById('title').value;
    const priceInput = document.getElementById('price').value;

    const descriptionValue = document.getElementById('description')?.value || 'Producto añadido por Socket';
    const stockValue = Number(document.getElementById('stock')?.value) || 10;
    const categoryValue = document.getElementById('category')?.value || 'General';
    
    const codeValue = document.getElementById('code')?.value || generateUniqueCode();

    if (!titleInput || priceInput <= 0) {
        console.error("El título y el precio son obligatorios.");
        return;
    }

    const newProduct = {
        title: titleInput,
        price: Number(priceInput),
        
        description: descriptionValue,
        code: codeValue,
        stock: stockValue,
        category: categoryValue,         
    };

    socket.emit('newProduct', newProduct); 

    form.reset();
});

const deleteProduct = (id) => {
    socket.emit('deleteProduct', id);
};



socket.on('productsUpdate', (products) => {
    productList.innerHTML = ''; 

    products.forEach(product => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${product.title}</strong> - $${product.price} (ID: ${product.id}) 
            <button onclick="deleteProduct('${product.id}')">Eliminar</button>
        `;
        productList.appendChild(li);
    });
});

window.deleteProduct = deleteProduct;

socket.on('connect', () => {
    socket.emit('getInitialProducts');
});