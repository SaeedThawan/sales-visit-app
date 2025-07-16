const API_BASE = 'https://script.google.com/macros/s/AKfycbzHjxC1yPIr7oKSYiNCkHKmSlvNhXGfaUADsDag4jCl9boNicwPdJSjusoy9IWR3wzw/exec'; // <-- عدّل لاحقًا

// تحميل البيانات من ملفات JSON
async function loadJSON(url) {
  const response = await fetch(url);
  return response.json();
}

async function populateDropdowns() {
  const [customers, reps, categoriesData, visitTypes] = await Promise.all([
    loadJSON('data/customers_main.json'),
    loadJSON('data/sales_representatives.json'),
    loadJSON('data/products_data.json'),
    loadJSON('data/visit_types.json')
  ]);

  const customerSelect = document.getElementById('customer');
  customers.forEach(c => {
    const option = document.createElement('option');
    option.value = c.Customer_ID;
    option.textContent = c.Customer_Name_AR;
    customerSelect.appendChild(option);
  });

  const repSelect = document.getElementById('salesRep');
  reps.forEach(rep => {
    const option = document.createElement('option');
    option.value = rep.Sales_Rep_ID;
    option.textContent = rep.Sales_Rep_Name_AR;
    repSelect.appendChild(option);
  });

  // استخراج التصنيفات الفريدة
  const uniqueCategories = [...new Set(categoriesData.map(p => p.Category))];
  const categorySelect = document.getElementById('category');
  uniqueCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  const visitTypeSelect = document.getElementById('visitType');
  visitTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.Visit_Type_ID;
    option.textContent = type.Visit_Type_Name_AR;
    visitTypeSelect.appendChild(option);
  });

  categorySelect.addEventListener('change', () => {
    const selectedCategory = categorySelect.value;
    const filteredProducts = categoriesData.filter(p => p.Category === selectedCategory);
    displayProducts(filteredProducts);
  });
}

function displayProducts(products) {
  const section = document.getElementById('products-section');
  section.innerHTML = `<h4>المنتجات تحت التصنيف:</h4>`;
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <span>${product.Product_Name_AR}</span>
      <label><input type="radio" name="product-${product.SKU}" value="available"> متوفر</label>
      <label><input type="radio" name="product-${product.SKU}" value="unavailable"> غير متوفر</label>
    `;
    section.appendChild(div);
  });
}

document.getElementById('visit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    Customer_ID: document.getElementById('customer').value,
    Sales_Rep_ID: document.getElementById('salesRep').value,
    Visit_Date: document.getElementById('date').value,
    Visit_Time: document.getElementById('time').value,
    Visit_Purpose: document.getElementById('purpose').value,
    Visit_Outcome: document.getElementById('outcome').value,
    Notes: document.getElementById('notes').value,
    Product_ID: document.getElementById('mainProduct').value,
    Visit_Type: document.getElementById('visitType').value,
    Available_Products_SKUs: [],
    Unavailable_Products_SKUs: []
  };

  // تجميع حالة المنتجات من الراديو
  const radios = document.querySelectorAll('[type="radio"]');
  radios.forEach(r => {
    if (r.checked) {
      const sku = r.name.replace('product-', '');
      if (r.value === 'available') formData.Available_Products_SKUs.push(sku);
      else if (r.value === 'unavailable') formData.Unavailable_Products_SKUs.push(sku);
    }
  });

  // إرسال البيانات
  const response = await fetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(formData),
    headers: { 'Content-Type': 'application/json' }
  });

  const result = await response.json();
  document.getElementById('status').textContent = result.message || 'تم الإرسال بنجاح ✅';
});
