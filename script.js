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

  fillSelect('salesRep', reps, 'Sales_Rep_Name_AR');
  fillSelect('customer', customers, 'Customer_Name_AR');
  fillSelect('visitType', visitTypes, 'Visit_Type_Name_AR');
  fillSelect('purpose', purposes);
  fillSelect('outcome', outcomes);

  document.getElementById('customerSearch').addEventListener('input', function () {
    const term = this.value.trim().toLowerCase();
    const filtered = customersData.filter(c => c.Customer_Name_AR.toLowerCase().includes(term));
    fillSelect('customer', filtered, 'Customer_Name_AR');
  });

  const categoryOptions = document.getElementById('categoryOptions');
  const categories = [...new Set(productsData.map(p => p.Category))];
  categories.forEach(cat => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${cat}" class="categoryBox"> ${cat}`;
    categoryOptions.appendChild(label);
  });

  categoryOptions.addEventListener('change', () => {
    const selected = Array.from(document.querySelectorAll('.categoryBox:checked')).map(cb => cb.value);
    const filtered = selected.length ? productsData.filter(p => selected.includes(p.Category)) : [];
    displayProducts(filtered);
  });
}

function fillSelect(id, items, key) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  items.forEach(item => {
    const val = key ? item[key] : item;
    const option = document.createElement('option');
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

function displayProducts(products) {
  const section = document.getElementById('products-section');
  section.innerHTML = "<h4>المنتجات حسب التصنيفات:</h4>";
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <span>${p.Product_Name_AR}</span>
      <label><input type="radio" name="product-${p.Product_Name_AR}" value="متوفر"> متوفر</label>
      <label><input type="radio" name="product-${p.Product_Name_AR}" value="غير متوفر"> غير متوفر</label>
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
    Entry_User_Name: document.getElementById('entryUser').value,
    Sales_Rep_Name_AR: document.getElementById('salesRep').value,
    Customer_Name_AR: document.getElementById('customer').value,
    Product_Name_AR: document.getElementById('mainProduct').value || '',
    Visit_Purpose: document.getElementById('purpose').value,
    Visit_Outcome: document.getElementById('outcome').value,
    Notes: document.getElementById('notes').value || '',
    Customer_Type: document.getElementById('customerType').value,
    Available_Products_Names: [],
    Unavailable_Products_Names: [],
    Next_Visit_Date: ""
  };

  for (let name of productNames) {
    const radios = document.getElementsByName(`product-${name}`);
    const checked = Array.from(radios).find(r => r.checked);
    if (!checked) {
      alert(`يرجى تحديد حالة المنتج: ${name}`);
      return;
    }
    if (checked.value === 'متوفر') formData.Available_Products_Names.push(name);
    else formData.Unavailable_Products_Names.push(name);
  }

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });
    const result = await res.json();
    document.getElementById('status').textContent = result.message || '✅ تم إرسال البيانات بنجاح!';
    this.reset();
    document.getElementById('products-section').innerHTML = "";
    document.querySelectorAll('.categoryBox').forEach(cb => cb.checked = false);
  } catch (err) {
    document.getElementById('status').textContent = `❌ خطأ أثناء الإرسال: ${err.message}`;
  }
});

document.getElementById('modeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

initForm();
