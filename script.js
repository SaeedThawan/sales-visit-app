const API_BASE = 'https://script.google.com/macros/s/AKfycbzlhp0wlQdzUiXj7rYhdBsJbZz9VuJgbQwFaZvwdrwsCm8zx4Q8KJia1UNoRge3yq98/exec';

let customersData = [];
let productsData = [];

async function loadJSON(url) {
  const response = await fetch(url);
  return response.json();
}

async function initForm() {
  const [customers, reps, visitTypes, products, purposes, outcomes] = await Promise.all([
    loadJSON('data/customers_main.json'),
    loadJSON('data/sales_representatives.json'),
    loadJSON('data/visit_types.json'),
    loadJSON('data/products_data.json'),
    loadJSON('data/visit_purposes.json'),
    loadJSON('data/visit_outcomes.json')
  ]);

  customersData = customers;
  productsData = products;

  // تعبئة الحقول المنسدلة
  fillSelect('salesRep', reps, 'Sales_Rep_Name_AR');
  fillSelect('customer', customers, 'Customer_Name_AR');
  fillSelect('visitType', visitTypes, 'Visit_Type_Name_AR');
  fillSelect('purpose', purposes);
  fillSelect('outcome', outcomes);

  // تعبئة البحث عن العميل
  const customerSearch = document.getElementById('customerSearch');
  customerSearch.addEventListener('input', () => {
    const searchTerm = customerSearch.value.trim().toLowerCase();
    const filtered = customersData.filter(c => c.Customer_Name_AR.toLowerCase().includes(searchTerm));
    fillSelect('customer', filtered, 'Customer_Name_AR');
  });

  // تعبئة التصنيفات كـ checkboxes
  const categoryOptions = document.getElementById('categoryOptions');
  const uniqueCategories = [...new Set(products.map(p => p.Category))];
  uniqueCategories.forEach(cat => {
    const box = document.createElement('label');
    box.innerHTML = `<input type="checkbox" value="${cat}" class="categoryBox"> ${cat}`;
    categoryOptions.appendChild(box);
  });

  // عند تغيير التصنيفات
  categoryOptions.addEventListener('change', () => {
    const selectedCats = Array.from(document.querySelectorAll('.categoryBox:checked')).map(cb => cb.value);
    const filtered = selectedCats.length
      ? productsData.filter(p => selectedCats.includes(p.Category))
      : [];
    displayProducts(filtered);
  });
}

function fillSelect(id, list, key) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  list.forEach(item => {
    const val = key ? item[key] : item;
    let option = document.createElement('option');
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

function displayProducts(products) {
  const section = document.getElementById('products-section');
  section.innerHTML = "<h4>المنتجات حسب التصنيفات المختارة:</h4>";

  products.forEach(prod => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <span>${prod.Product_Name_AR}</span>
      <label><input type="radio" name="product-${prod.Product_Name_AR}" value="متوفر"> متوفر</label>
      <label><input type="radio" name="product-${prod.Product_Name_AR}" value="غير متوفر"> غير متوفر</label>
    `;
    section.appendChild(div);
  });
}

document.getElementById('visit-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const visibleRadios = document.querySelectorAll('#products-section input[type="radio"]');
  const productNames = [...new Set(Array.from(visibleRadios).map(r => r.name.replace('product-', '')))];
  const formData = {
    Visit_Type_Name_AR: document.getElementById('visitType').value,
    Entry_User