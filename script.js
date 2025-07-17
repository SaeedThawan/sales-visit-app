// بيانات الربط
const SPREADSHEET_ID = '1AUWwYTxn5E3sLFb7OFCi36dcbso0NDjzrtH0jxbdduM';
const SHEET_NAME = 'Visit_Logs';
const API_KEY = 'AIzaSyCAYZecKVrOWGlyKoxLqdzkVav4F5vLGxo';

document.getElementById('visitForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // تجميع البيانات من النموذج
  const data = {
    Customer_Name_AR: document.getElementById('Customer_Name_AR').value,
    Sales_Rep_Name_AR: document.getElementById('Sales_Rep_Name_AR').value,
    Product_Name_AR: document.getElementById('Product_Name_AR').value,
    Visit_Type_Name_AR: document.getElementById('Visit_Type_Name_AR').value,
    Visit_Purpose: document.getElementById('Visit_Purpose').value,
    Visit_Outcome: document.getElementById('Visit_Outcome').value,
    Next_Visit_Date: document.getElementById('Next_Visit_Date').value,
    Notes: document.getElementById('Notes').value,
    Entry_User_Name: document.getElementById('Entry_User_Name').value,
    Customer_Type: document.getElementById('Customer_Type').value,
    Available_Products_Names: '', // يمكن إضافتها لاحقًا كاختيارات متعددة
    Unavailable_Products_Names: '', // نفس الشيء
  };

  const now = new Date();
  const visitId = 'VISIT-' + now.getTime();
  const visitDate = now.toISOString().split('T')[0];
  const visitTime = now.toTimeString().split(' ')[0];
  const timestamp = now.toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

  const row = [
    visitId,
    data.Customer_Name_AR,
    data.Sales_Rep_Name_AR,
    data.Product_Name_AR || '',
    visitDate,
    visitTime,
    data.Visit_Purpose,
    data.Visit_Outcome,
    data.Next_Visit_Date || '',
    data.Notes || '',
    data.Visit_Type_Name_AR,
    data.Available_Products_Names,
    data.Unavailable_Products_Names,
    data.Entry_User_Name,
    timestamp,
    data.Customer_Type
  ];

  const body = {
    values: [row]
  };

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const statusEl = document.getElementById('status');
    if (response.ok) {
      statusEl.textContent = '✅ تم إرسال البيانات بنجاح!';
      this.reset(); // تصفير النموذج
    } else {
      const error = await response.json();
      statusEl.textContent = '❌ خطأ في الإرسال: ' + error.error.message;
    }
  } catch (err) {
    document.getElementById('status').textContent = '❌ مشكلة في الاتصال: ' + err.message;
  }
});
