function saveAsPDF() {
    const customerInfo = JSON.parse(localStorage.getItem("customerInfo") || "{}");
    const mobile = customerInfo.mobile || "unknown";
    const name = customerInfo.name ? customerInfo.name.toLowerCase().replace(/\s+/g, "_") : "unknown";
    const fileName = `${mobile}_${name}.pdf`;
  
    const element = document.body.cloneNode(true);
  
    // Remove buttons from PDF
    const btns = element.querySelector(".btns");
    if (btns) btns.remove();
  
    html2pdf().set({
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  }
  