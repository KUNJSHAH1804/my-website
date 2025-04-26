const express = require("express");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const axios = require("axios");
const twilio = require("twilio");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = 3000;

// Twilio credentials from .env
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Function to generate PDF in memory
function generateInvoicePDF(customer, cart) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    // Capture the generated PDF into buffers
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      console.log("PDF generated successfully!"); // Debug log
      resolve(pdfBuffer);  // Resolving the PDF buffer
    });

    doc.fontSize(18).text("Dhanesh Enterprise", { align: "center" });
    doc.fontSize(12).text("11, Kisan Kranti building, Market Yard Ahmednagar", { align: "center" });
    doc.text("Mobile: 9822475240", { align: "center" });
    doc.moveDown();

    doc.text(`Customer: ${customer.name}`);
    doc.text(`Mobile: ${customer.mobile}`);
    doc.moveDown();

    cart.forEach(item => {
      const total = (item.quantity * item.price).toFixed(2);
      doc.text(`${item.name} (${item.size}) x ${item.quantity} - ₹${total}`);
    });

    const grandTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    doc.moveDown();
    doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`);

    doc.end();
  });
}

// Route to send invoice via WhatsApp
app.post("/send-invoice", async (req, res) => {
  const { customer, cart } = req.body;
  const { mobile } = customer;

  if (!mobile || !cart || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid customer or cart data." });
  }

  try {
    const pdfBuffer = await generateInvoicePDF(customer, cart);

    // Upload to File.io or another public host
    const uploadRes = await axios.post("https://file.io/?expires=1d", pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf"
      }
    });

    // Debug log to see if the PDF is uploaded successfully
    console.log("PDF Upload Response:", uploadRes.data);

    const fileUrl = uploadRes?.data?.link;
    if (!fileUrl) throw new Error("PDF upload failed.");

    // Send media via WhatsApp
    await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox or approved number
      to: `whatsapp:+91${mobile}`,    // Customer's number
      body: `Hi ${customer.name}, here is your invoice from Dhanesh Enterprise.`,
      mediaUrl: [fileUrl]             // Important: sending as media
    });

    res.json({ success: true, message: "Invoice sent with PDF!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send PDF invoice.", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
