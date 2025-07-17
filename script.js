// إعدادات Google Sheets
const SPREADSHEET_ID = '1AUWwYTxn5E3sLFb7OFCi36dcbso0NDjzrtH0jxbdduM';
const SHEET_NAME = 'Visit_Logs';
const API_KEY = 'AIzaSyCAYZecKVrOWGlyKoxLqdzkVav4F5vLGxo';

// روابط ملفات JSON من GitHub Pages
const DATA_BASE = 'https://saeedthawan.github.io/sales-visit-app/data/';
const JSON_FILES = {
  reps: 'sales_representatives.json',
  customers: 'customers_main.json',
  visitTypes: 'visit_types.json',
  purposes: 'visit_purposes.json',
  outcomes: 'visit_outcomes.json',
  products: 'products_data.json'
};

let productsList = [];

async function loadJSON(file) {
  const res = await fetch(DATA_BASE + file);
  return res.json();
}

async function populateForm() {
  const [reps, customers, visitTypes, purposes, outcomes, products] = await Promise.all([
    loadJSON(JSON_FILES.reps),
    loadJSON(JSON_FILES.customers),
    loadJSON(JSON_FILES.visitTypes),
    loadJSON(JSON_FILES.purposes),
    loadJSON(JSON_FILES.outcomes),
    loadJSON(JSON_FILES.products)
  ]);

  productsList = products;

  // التصنيفات
  const categories = [...new Set(products.map(p => p.Category))];
  const categorySection = document.getElementById('categorySelection');
  categories.forEach(cat => {
    const div = document.createElement('div');
    div.innerHTML = `<label><input type="checkbox" value="${cat}"> ${cat}</label>`;
    categorySection.appendChild(div);
  });

  categorySection.addEventListener('change', showProductsBySelectedCategories);

  // العملاء
  customers.forEach(c => {
    const option = new Option(c.Customer_Name_AR, c.Customer_ID);
    document.getElementById('Customer_ID').append(option);
  });

  document.getElementById('Customer_ID').addEventListener('change', () => {
    const selected = customers.find(c => c.Customer_ID === document.getElementById('Customer_ID').value);
    document.getElementById('Customer_Type').value = selected?.Customer_Type || '';
  });

  // المندوبين
  reps.forEach(r => {
    const option = new Option(r.Sales_Rep_Name_AR, r.Sales_Rep_ID);
    document.getElementById('Sales_Rep_ID').append(option);
  });

  // أنواع الزيارة
  visitTypes.forEach(t => {
    const option = new Option(t.Visit_Type_Name_AR, t.Visit_Type_ID);
    document.getElementById('Visit_Type_ID').append(option);
  });

  // الأغراض
  purposes.forEach(p => {
    const option = new Option(p, p);
    document.getElementById('Visit_Purpose').append(option);
  });

  // النتائج
  outcomes.forEach(o => {
    const option = new Option(o, o);
    document.getElementById('Visit_Outcome').append(option);
  });
}

function showProductsBySelectedCategories() {
  const selectedCategories = Array.from(document.querySelectorAll('#categorySelection input[type="checkbox"]:checked')).map(cb => cb.value);
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';

  selectedCategories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'product-group';
    group.innerHTML = `<h4>${cat}</h4>`;

    const filteredProducts = productsList.filter(p => p.Category === cat);
    filteredProducts.forEach(p => {
      const item = document.createElement('div');
      item.className = 'product-item';
      item.innerHTML = `
        <label>${p.Product_Name_AR}</label>
        <input type="radio" name="${p.Product_Name_AR}" value="available"> متوفر
        <input type="radio" name="${p.Product_Name_AR}" value="unavailable"> غير متوفر
      `;
      group.appendChild(item);
    });

    container.appendChild(group);
  });
}

function getText(id) {
  const el = document.querySelector(`#${id} option[value="${document.getElementById(id).value}"]`);
  return el?.textContent || '';
}

document.getElementById('visitForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    Visit_ID: 'VISIT-' + Date.now(),
    Customer_Name_AR: getText('Customer_ID'),
    Sales_Rep_Name_AR: getText('Sales_Rep_ID'),
    Product_Name_AR: document.getElementById('Product_Name_AR').value || '',
    Visit_Purpose: document.getElementById('Visit_Purpose').value,
    Visit_Outcome: document.getElementById('Visit_Outcome').value,
    Next_Visit_Date: document.getElementById('Next_Visit_Date').value || '',
    Notes: document.getElementById('Notes').value || '',
    Visit_Type_Name_AR: getText('Visit_Type_ID'),
    Entry_User_Name: document.getElementById('Entry_User_Name').value,
    Customer_Type: document.getElementById('Customer_Type').value
  };

  const now = new Date();
  const Visit_Date = now.toISOString().split('T')[0];
  const Visit_Time = now.toTimeString().split(' ')[0];
  const Timestamp = now.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

  const selectedRadios = document.querySelectorAll('#productsContainer input[type="radio"]:checked');
  const available = [];
  const unavailable = [];

  selectedRadios.forEach(r => {
    if (r.value === 'available') available.push(r.name);
    else unavailable.push(r.name);
  });

  const totalVisibleProducts = document.querySelectorAll('#productsContainer input[type="radio"]');
  const groupedNames = Array.from(totalVisibleProducts).reduce((acc, input) => {
    acc[input.name] = true;
    return acc;
  }, {});
  const checkedNames = new Set(Array.from(selectedRadios).map(r => r.name));
  const missed = Object.keys(groupedNames).filter(name => !checkedNames.has(name));

  if (missed.length > 0) {
    alert('⚠️ يجب تحديد الحالة لكل منتج ظاهر.');
    return;
  }

  const row = [
    data.Visit_ID,
    data.Customer_Name_AR,
    data.Sales_Rep_Name_AR,
    data.Product_Name_AR,
    Visit_Date,
    Visit_Time,
    data.Visit_Purpose,
    data.Visit_Outcome,
    data.Next_Visit_Date,
    data.Notes,
    data.Visit_Type_Name_AR,
    available.join(','),
    unavailable.join(','),
    data.Entry_User_Name,
    Timestamp,
    data.Customer_Type
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
  const body = { values: [row] };
  const statusEl = document.getElementById('status');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      statusEl.textContent = '✅ تم إرسال البيانات بنجاح!';
      statusEl.className = 'status-message success';
      e.target.reset();
      document.getElementById('productsContainer').innerHTML = '';
      document.getElementById('Customer_Type').value = '';
    } else {
      const err = await res.json();
      statusEl.textContent = '❌ خطأ: ' + err.error.message;
      statusEl.className = 'status-message error';
    }
  } catch (err) {
    statusEl.textContent = '❌ مشكلة في الاتصال: ' + err.message;
    statusEl.className = 'status-message error';
  }
});

populateForm();
