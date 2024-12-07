async function importCSS(href) {
  try {
    const response = await fetch(href);
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

  // กำหนด Sheet IDs
  const customerSheetId = "1fDUNn7iqEOND9X2s-PhakFtqjNsvVs8nc8ZZKVB9cU4"; // ข้อมูลลูกค้า
  const paymentSheetId = "1vSMQY9niqjMS2DCXHei7b3shXiH71VHxrfjwqlXktio"; // แจ้งชำระเงิน

  // สร้าง URLs สำหรับดึงข้อมูล
  const customerUrl = `https://docs.google.com/spreadsheets/d/${customerSheetId}/gviz/tq?tqx=out:csv`;
  const paymentUrl = `https://docs.google.com/spreadsheets/d/${paymentSheetId}/gviz/tq?tqx=out:csv`;

  Promise.all([
    fetch(customerUrl).then((response) => response.text()),
    fetch(paymentUrl).then((response) => response.text()),
  ])
    .then(([customerData, paymentData]) => {
      // แปลง CSV เป็น Array
      const customerRows = customerData
        .split("\n")
        .map((row) =>
          row.split(",").map((cell) => cell.replace(/['"]+/g, "").trim())
        );
      const paymentRows = paymentData
        .split("\n")
        .map((row) =>
          row.split(",").map((cell) => cell.replace(/['"]+/g, "").trim())
        );

      // สร้างชุดข้อมูลจากช่อง C ของการชำระเงิน
      const paymentNames = new Set();
      paymentRows.slice(1).forEach((row) => {
        const name = row[3]; // ช่อง C (index 2)
        if (name && name.trim()) {
          paymentNames.add(name.toLowerCase().trim());
        }
      });

      // กรองข้อมูลลูกค้าและลบรายการซ้ำ
      const uniqueCustomers = new Map(); // ใช้ Map เพื่อเก็บรายการที่ไม่ซ้ำ

      customerRows.slice(1).forEach((row) => {
        const customerName = row[3]; // ช่อง C (index 2)
        if (customerName) {
          const normalizedName = customerName.toLowerCase().trim();
          if (paymentNames.has(normalizedName)) {
            // เก็บเฉพาะรายการแรกของชื่อที่ซ้ำ
            if (!uniqueCustomers.has(normalizedName)) {
              uniqueCustomers.set(normalizedName, row);
            }
          }
        }
      });

      // แปลง Map เป็น Array สำหรับแสดงผล
      const filteredCustomers = Array.from(uniqueCustomers.values());

      // แสดงผลในตาราง
      const tbody = document.querySelector(".name-table tbody");
      tbody.innerHTML = ""; // เคลียร์ข้อมูลเดิม

      if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">
                        ไม่พบข้อมูล
                    </td>
                </tr>
            `;
      } else {
        filteredCustomers.forEach((row, index) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${row[3] || ""}</td> <!-- ชื่อ-นามสกุล -->
                    <td>${row[7] || ""}</td> <!-- โรงเรียน -->
                    <td>
                        <span class="status-paid">
                            <i class="bi bi-check-circle-fill"></i>
                            ชำระแล้ว
                        </span>
                    </td>
                `;
          tbody.appendChild(tr);
        });
      }
    })
    .catch((error) => {
      console.error("Error loading data:", error);
      document.querySelector(".name-table tbody").innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: red;">
                    ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
                </td>
            </tr>
        `;
    });
});
