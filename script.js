// رابط Google Apps Script الخاص بك
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

  // البحث عن العميل
  document.getElementById('customerSearch').addEventListener('input', function () {
    const searchTerm = this.value.trim().toLowerCase();
    const filtered = customersData.filter(c => c.Customer_Name_AR.toLowerCase().includes(searchTerm));
    fillSelect('customer', filtered, 'Customer_Name_AR');
  });

  // تعبئة التصنيفات كـ checkboxes متعددة
  const categoryOptions = document.getElementById('categoryOptions');
  const uniqueCategories = [...new Set(productsData.map(p => p.Category))];
  uniqueCategories.forEach(cat => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${cat}" class="categoryBox"> ${cat}`;
    categoryOptions.appendChild(label);
  });

  categoryOptions.addEventListener('change', () => {
    const selectedCats = Array.from(document.querySelectorAll('.categoryBox:checked')).map(cb => cb.value);
    const filteredProducts = selectedCats.length
      ? productsData.filter(p => selectedCats.includes(p.Category))
      : [];
    displayProducts(filteredProducts);
  });
}

function fillSelect(id, list, key) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  list.forEach(item => {
    const value = key ? item[key] : item;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
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
    Entry_User_Name: document.getElementById('entryUser').value,
    Sales_Rep_Name_AR: document.getElementById('salesRep').value,
    Customer_Name_AR: document.getElementById('customer').value,
    Product_Name_AR: document.getElementById('mainProduct').value || '',
    Visit_Purpose: document.getElementById('purpose').value,
    Visit_Outcome: document.getElementById('outcome').value,
    Notes: document.getElementById('notes').value || '',
    Customer_Type: document.getElementById('customerType').value,
    Next_Visit_Date: "", // جاهز لاحقًا لو حبيت تفعلها
    Available_Products_Names: [],
    Unavailable_Products_Names: []
  };

  // التأكد من تحديد حالة كل منتج ظاهر
  for (let name of productNames) {
    const radios = document.getElementsByName(`product-${name}`);
    const selected = Array.from(radios).find(r => r.checked);
    if (!selected) {
      alert(`يرجى تحديد حالة المنتج: ${name}`);
      return;
    }
    if (selected.value === "متوفر") formData.Available_Products_Names.push(name);
    else formData.Unavailable_Products_Names.push(name);
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
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

// زر الوضع الليلي
document.getElementById('modeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// تشغيل النموذج
initForm();
