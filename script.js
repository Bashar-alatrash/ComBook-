// تحميل جهات الاتصال من localStorage
function loadContacts() {
  return JSON.parse(localStorage.getItem('phonebook')) || {};
}

// حفظ جهات الاتصال في localStorage
function saveContacts(contacts) {
  localStorage.setItem('phonebook', JSON.stringify(contacts));
}

// عرض جميع جهات الاتصال
function displayContacts(filteredContacts = null) {
  const contacts = filteredContacts || loadContacts();
  const contactsList = document.getElementById('contactsList');
  contactsList.innerHTML = '';
  for (const [name, details] of Object.entries(contacts)) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${name}</td>
      <td>${details.phone}</td>
      <td>${details.address || "غير متوفر"}</td>
      <td>${details.email || "غير متوفر"}</td>
      <td>
        <i class="fas fa-edit edit-btn" onclick="openEditModal('${name}')"></i>
        <i class="fas fa-times delete-btn" onclick="deleteContact('${name}')"></i>
      </td>
    `;
    contactsList.appendChild(row);
  }
}

// إضافة جهة اتصال
document.getElementById('addContactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim() || "غير متوفر";
  const email = document.getElementById('email').value.trim() || "غير متوفر";
  if (!name || !phone) return alert("الرجاء إدخال الاسم ورقم الهاتف.");
  const contacts = loadContacts();
  contacts[name] = { phone, address, email };
  saveContacts(contacts);
  displayContacts();
  closeAddModal();
  document.getElementById('addContactForm').reset();
});

// البحث التلقائي عند الكتابة
document.getElementById('searchInput').addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  const contacts = loadContacts();
  const filteredContacts = {};

  for (const [name, details] of Object.entries(contacts)) {
    const nameMatch = name.toLowerCase().includes(searchTerm);
    const phoneMatch = String(details.phone).toLowerCase().includes(searchTerm);
    const addressMatch = (details.address && String(details.address).toLowerCase().includes(searchTerm)) || false;
    const emailMatch = (details.email && String(details.email).toLowerCase().includes(searchTerm)) || false;

    if (nameMatch || phoneMatch || addressMatch || emailMatch) {
      filteredContacts[name] = details;
    }
  }

  displayContacts(filteredContacts);
});

// حذف جهة اتصال
function deleteContact(name) {
  const contacts = loadContacts();
  delete contacts[name];
  saveContacts(contacts);
  displayContacts();
}

// تصدير إلى Excel
function exportToExcel() {
  const contacts = loadContacts();
  const data = Object.entries(contacts).map(([name, details]) => ({
    الاسم: name,
    "رقم الهاتف": details.phone,
    العنوان: details.address || "غير متوفر",
    "البريد الإلكتروني": details.email || "غير متوفر",
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "جهات الاتصال");
  XLSX.writeFile(workbook, "دليل_الهاتف.xlsx");
}

// استيراد من Excel
function importFromExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    const contacts = loadContacts();
    json.forEach(row => {
      contacts[row["الاسم"]] = {
        phone: String(row["رقم الهاتف"]),
        address: row["العنوان"] || "غير متوفر",
        email: row["البريد الإلكتروني"] || "غير متوفر",
      };
    });
    saveContacts(contacts);
    displayContacts();
  };
  reader.readAsArrayBuffer(file);
}

// فتح وإغلاق Modal لإضافة جهة اتصال
function openAddModal() {
  document.getElementById('addModal').style.display = 'block';
}
function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

// فتح نافذة التعديل
let currentEditName = null; // لتخزين اسم السجل الحالي قيد التعديل

function openEditModal(name) {
  const contacts = loadContacts();
  const contact = contacts[name];
  if (!contact) return;

  // تعبئة البيانات في النموذج
  document.getElementById('editName').value = name;
  document.getElementById('editPhone').value = contact.phone;
  document.getElementById('editAddress').value = contact.address || "";
  document.getElementById('editEmail').value = contact.email || "";

  // تخزين اسم السجل الحالي قيد التعديل
  currentEditName = name;

  // عرض النافذة المنبثقة
  document.getElementById('editModal').style.display = 'block';
}

// إغلاق نافذة التعديل
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditName = null;
}

// حفظ التعديلات
document.getElementById('editContactForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const newName = document.getElementById('editName').value.trim();
  const newPhone = document.getElementById('editPhone').value.trim();
  const newAddress = document.getElementById('editAddress').value.trim() || "غير متوفر";
  const newEmail = document.getElementById('editEmail').value.trim() || "غير متوفر";

  if (!newName || !newPhone) return alert("الرجاء إدخال الاسم ورقم الهاتف.");

  const contacts = loadContacts();

  // إذا تم تغيير الاسم، يجب نقل السجل إلى الاسم الجديد
  if (currentEditName !== newName) {
    delete contacts[currentEditName]; // حذف السجل القديم
  }

  // تحديث السجل
  contacts[newName] = { phone: newPhone, address: newAddress, email: newEmail };
  saveContacts(contacts);

  // إعادة عرض جهات الاتصال وإغلاق النافذة
  displayContacts();
  closeEditModal();
});

// عرض جهات الاتصال عند تحميل الصفحة
window.onload = displayContacts;