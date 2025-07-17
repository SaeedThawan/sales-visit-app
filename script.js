// إعدادات Google Sheets API
const SPREADSHEET_ID = '1AUWwYTxn5E3sLFb7OFCi36dcbso0NDjzrtH0jxbdduM';
const SHEET_NAME = 'Visit_Logs';
const API_KEY = 'AIzaSyCAYZecKVrOWGlyKoxLqdzkVav4F5vLGxo';

// روابط ملفات JSON على GitHub Pages
const DATA_BASE = 'https://raw.githubusercontent.com/SaeedUser/sales-visit-app/main/data/';
const JSON_FILES = {
  reps: 'sales_representatives.json',
  customers: 'customers_main.json',
  visitTypes: 'visit_types.json',
  purposes: 'visit_purposes.json',
  outcomes: 'visit_outcomes.json',
  products: 'products_data.json'
};

// تحميل بيانات JSON
async function loadJSON(filename) {
  const res = await fetch(DATA_BASE + filename);
  return res.json();
}

async function populateForm() {
  const reps = await loadJSON(JSON_FILES.reps);
  const customers = await loadJSON(JSON_FILES.customers);
  const visitTypes = await loadJSON(JSON_FILES.visitTypes);
  const purposes = await loadJSON(JSON_FILES.purposes);
  const outcomes = await loadJSON(JSON_FILES.outcomes);
  const products = await loadJSON(JSON_FILES.products);

  // المندوبين
  reps.forEach(rep => {
    const option = new Option(rep.Sales_Rep_Name_AR, rep.Sales_Rep_ID);
    document.getElementById('Sales_Rep_ID').append(option);
  });

  // العملاء
  customers.forEach(cust => {
    const option = new Option(cust.Customer_Name_AR, cust.Customer_ID);
    document.getElementById('Customer_ID').append(option);
  });

  document.getElementById('Customer_ID').addEventListener('change', () => {
    const selected = customers.find(c => c.Customer_ID === document.getElementById('Customer_ID').value);
    document.getElementById('Customer_Type').value = selected?.Customer_Type || '';
  });

  // نوع الزيارة
  visitTypes.forEach(type => {
    const option = new Option(type.Visit_Type_Name_AR, type.Visit_Type_ID);
    document.getElementById('Visit_Type_ID').append(option);
  });

  // الغرض
  purposes.forEach(p => {
    const option = new Option(p.Visit_Purpose, p.Visit_Purpose);
    document.getElementById('Visit_Purpose').append(option);
  });

  // النتيجة
  outcomes.forEach(o => {
    const option = new Option(o.Visit_Outcome, o.Visit_Outcome);
    document.getElementById('Visit_Outcome').append(option);
  });

  // التصنيفات
  const categories = [...new Set(products.map(p => p.Category))];
  categories.forEach(cat => {
    const option = new Option(cat, cat);
    document.getElementById('Product_Category').append(option);
  });

  // تحميل المنتجات حسب التصنيف
  document.getElementById('Product_Category').addEventListener('change', () => {
    const selected = document.getElementById('Product_Category').value;
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    const filtered = products.filter(p => p.Category === selected);

    filtered.forEach(prod => {
      const row = document.createElement('div');
      row.className = 'product-row';
      row.innerHTML = `
        <label>${prod.Product_Name_AR}</label>
        <input type="radio" name="${prod.Product_ID}" value="available"> متوفر
        <input type="radio" name="${prod.Product_ID}" value="unavailable"> غير متوفر
      `;
      container.appendChild(row);
    });
  });
}

populateForm();

// عند إرسال النموذج
document.getElementById('visitForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    Visit_ID: 'VISIT-' + Date.now(),
    Customer_ID: document.getElementById('Customer_ID').value,
    Sales_Rep_ID: document.getElementById('Sales_Rep_ID').value,
    Product_Name_AR: document.getElementById('Product_Name_AR').value || '',
    Visit_Purpose: document.getElementById('Visit_Purpose').value,
    Visit_Outcome: document.getElementById('Visit_Outcome').value,
    Next_Visit_Date: document.getElementById('Next_Visit_Date').value || '',
    Notes: document.getElementById('Notes').value || '',
    Visit_Type_Name_AR: document.getElementById('Visit_Type_ID').value,
    Entry_User_Name: document.getElementById('Entry_User_Name').value,
    Customer_Type: document.getElementById('Customer_Type').value
  };

  // المنتجات المختارة
  const inputs = document.querySelectorAll('#productsContainer input[type="radio"]:checked');
  const available = [];
  const unavailable = [];

  inputs.forEach(inp => {
    if (inp.value === 'available') available.push(inp.name);
    else if (inp.value === 'unavailable') unavailable.push(inp.name);
  });

  // التاريخ والوقت
  const now = new Date();
  const Visit_Date = now.toISOString().split('T')[0];
  const Visit_Time = now.toTimeString().split(' ')[0];
  const Timestamp = now.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

  // ترتيب الإرسال حسب الورقة
  const row = [
    data.Visit_ID,
    getCustomerName(data.Customer_ID),
    getRepName(data.Sales_Rep_ID),
    data.Product_Name_AR,
    Visit_Date,
    Visit_Time,
    data.Visit_Purpose,
    data.Visit_Outcome,
    data.Next_Visit_Date,
    data.Notes,
    getVisitTypeName(data.Visit_Type_Name_AR),
    available.join(','),
    unavailable.join(','),
    data.Entry_User_Name,
    Timestamp,
    data.Customer_Type
  ];

  const body = { values: [row] };

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

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

// وظائف مساعدة للعرض
function getCustomerName(id) {
  const el = document.querySelector(`#Customer_ID option[value="${id}"]`);
  return el?.textContent || '';
}

function getRepName(id) {
  const el = document.querySelector(`#Sales_Rep_ID option[value="${id}"]`);
  return el?.textContent || '';
}

function getVisitTypeName(id) {
  const el = document.querySelector(`#Visit_Type_ID option[value="${id}"]`);
  return el?.textContent || '';
}
