// Import Firestore functions (because app.js is loaded as type="module")
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Reference to the "orders" collection in Firestore
const ordersRef = collection(window.db, "orders");

// Handle Add Order form submit
const addOrderForm = document.getElementById("add-order-form");

addOrderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const itemSummary = document.getElementById("itemSummary").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!customerName || !itemSummary) {
    alert("Please fill in both name and item summary");
    return;
  }

  // Save order with timestamp
  await addDoc(ordersRef, {
    customerName,
    itemSummary,
    notes,
    status: "New",
    createdAt: new Date().toISOString(), // 🔥 timestamp saved here
  });

  addOrderForm.reset();
});

// Real-time listener for orders (newest first)
const q = query(ordersRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderOrders(orders);
});

// Render orders into the 4 columns
function renderOrders(orders) {
  const columns = {
    New: document.getElementById("column-new"),
    Preparing: document.getElementById("column-preparing"),
    Ready: document.getElementById("column-ready"),
    Collected: document.getElementById("column-collected"),
  };

  // Clear all columns
  Object.values(columns).forEach((col) => (col.innerHTML = ""));

  // Render each order card
  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "order-card";

    card.innerHTML = `
      <h3>${order.customerName}</h3>
      <p><strong>Items:</strong> ${order.itemSummary}</p>
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
      <p><strong>Time:</strong> ${order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : "N/A"}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <div class="move-buttons">
        ${createButtons(order)}
      </div>
    `;

    columns[order.status].appendChild(card);
  });
}

// Create buttons to move status
function createButtons(order) {
  const statuses = ["New", "Preparing", "Ready", "Collected"];

  return statuses
    .filter((s) => s !== order.status)
    .map(
      (s) =>
        `<button onclick="updateStatus('${order.id}', '${s}')">${s}</button>`
    )
    .join("");
}

// Update order status in Firestore
window.updateStatus = async (id, newStatus) => {
  const docRef = doc(window.db, "orders", id);
  await updateDoc(docRef, { status: newStatus });
};
