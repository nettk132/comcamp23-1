async function importCSS(href) {
  try {
    const response = await fetch(href);
    if (!response.ok) throw new Error(`Failed to load CSS: ${response.status}`);
    const css = await response.text();
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Error loading CSS:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  importCSS("assets/css/main.css");

  // URLs ของ Google Sheets ที่เผยแพร่เป็น CSV
  const customerUrl =

    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQukrEcCqnQ3vy6i1QRiUIx77-4QSPvcZz32UO1_difY6yKI_AgraF1OzTlqzPLSSmd8BdYeqsBxw_s/pub?gid=1986287788&single=true&output=csv";
  const paymentUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnYZfujGwHJuU1d6rFcwpyAE8Zwh621eiy1-PqfZ3Q-GTqhRrfglj10LC0WVSlqnlEZ1B-LQtdqKIg/pub?gid=1682310434&single=true&output=csv";

  // ฟังก์ชันสำหรับโหลด CSV และแปลงเป็น Array
  async function loadCSV(url) {
    try {
      const response = await fetch(url, { method: "GET", headers: { "Content-Type": "text/csv" } });
      if (!response.ok) throw new Error(`Failed to load CSV: ${response.status}`);
      const text = await response.text();
      return text
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.replace(/['"]+/g, "").trim()));
    } catch (error) {
      console.error("Error loading CSV:", error);
      throw error;
    }
  }

  // โหลดข้อมูลทั้งสองชุด
  Promise.all([loadCSV(customerUrl), loadCSV(paymentUrl)])
    .then(([customerRows, paymentRows]) => {
      // ตรวจสอบว่ามีข้อมูลใน CSV หรือไม่
      if (customerRows.length === 0 || paymentRows.length === 0) {
        throw new Error("CSV data is empty");
      }

      // สร้างชุดข้อมูลจากช่อง C ของการชำระเงิน
      const paymentNames = new Set(
        paymentRows.slice(1).map((row) => row[4]?.toLowerCase().trim()).filter(Boolean)
      );

      // กรองข้อมูลลูกค้า
      const uniqueCustomers = new Map();
      customerRows.slice(1).forEach((row) => {
        const customerName = row[4];
        if (customerName) {
          const normalizedName = customerName.toLowerCase().trim();
          if (paymentNames.has(normalizedName) && !uniqueCustomers.has(normalizedName)) {
            uniqueCustomers.set(normalizedName, row);
          }
        }
      });

      // แปลง Map เป็น Array สำหรับแสดงผล
      const filteredCustomers = Array.from(uniqueCustomers.values());

      // อัปเดตตารางในหน้าเว็บ
      const tbody = document.querySelector(".name-table tbody");
      tbody.innerHTML = ""; // ลบข้อมูลเดิมในตาราง

      if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center;">
              ไม่พบข้อมูล
            </td>
          </tr>`;
      } else {
        filteredCustomers.forEach((row, index) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row[4] || ""}</td> <!-- ชื่อ-นามสกุล -->
            <td>${row[8] || ""}</td> <!-- โรงเรียน -->
            <td>
              <span class="status-paid">
                <i class="bi bi-check-circle-fill"></i>
                ชำระแล้ว
              </span>
            </td>`;
          tbody.appendChild(tr);
        });
      }
    })
    .catch((error) => {
      console.error("Error processing data:", error);
      document.querySelector(".name-table tbody").innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: red;">
            ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
          </td>
        </tr>`;
    });
});
