// ═══════════════════════════════════════════════════════════════
//  RehabPlus — Google Sheets Data Integration
//  All form submissions (bookings, enquiries, reviews) are sent
//  to Google Sheets via a deployed Apps Script Web App.
//
//  SETUP GUIDE (5 minutes):
//  Step 1: Go to https://sheets.google.com → Create a new spreadsheet
//  Step 2: Name it "RehabPlus Data"
//  Step 3: Create these sheets (tabs):
//          • Bookings
//          • Enquiries  
//          • Reviews
//  Step 4: Go to Extensions → Apps Script
//  Step 5: Paste the Apps Script code from the admin panel
//          (Admin → ⚙️ Site Settings → Google Sheets Setup)
//  Step 6: Click Deploy → New deployment → Web App
//          → Execute as: Me → Who has access: Anyone → Deploy
//  Step 7: Copy the Web App URL
//  Step 8: Paste it below in SHEETS_WEBHOOK_URL
// ═══════════════════════════════════════════════════════════════

const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwGEs5SntV6GwgnF0DeN7tsqWmFJ3NqdOzA3AUC3jzxdppeBmAjL2GVCaoGBT1ou6z9/exec";

// ── Send data to Google Sheet ──────────────────────────────────
async function sendToSheet(sheetName, rowData) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL") {
    console.warn("RehabPlus Sheets: Not configured. Set SHEETS_WEBHOOK_URL in sheets-config.js");
    return false;
  }
  try {
    const payload = { sheet: sheetName, data: rowData, timestamp: new Date().toISOString() };
    const res = await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("RehabPlus Sheets: Sent to", sheetName);
    return true;
  } catch (e) {
    console.warn("RehabPlus Sheets error:", e.message);
    return false;
  }
}

// ── Booking submission ─────────────────────────────────────────
function sheetsSubmitBooking(data) {
  return sendToSheet("Bookings", {
    "Name":       data.name    || "",
    "Phone":      data.phone   || "",
    "Email":      data.email   || "",
    "Service":    data.service || "",
    "Type":       data.type    || "",
    "Date":       data.date    || "",
    "Time":       data.time    || "",
    "Notes":      data.notes   || "",
    "Status":     "New",
    "Source":     "Website"
  });
}

// ── Enquiry / Contact form ─────────────────────────────────────
function sheetsSubmitEnquiry(data) {
  return sendToSheet("Enquiries", {
    "Name":     data.name    || "",
    "Phone":    data.phone   || "",
    "Email":    data.email   || "",
    "Service":  data.service || "",
    "Message":  data.message || "",
    "Page":     data.page    || document.title,
    "Status":   "New"
  });
}

// ── Patient review / testimonial ──────────────────────────────
function sheetsSubmitReview(data) {
  return sendToSheet("Reviews", {
    "Name":     data.name    || "",
    "Rating":   data.rating  || "",
    "Review":   data.text    || "",
    "Service":  data.service || "",
    "Status":   "Pending"
  });
}
