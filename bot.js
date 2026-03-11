const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyDRQ3rFmOiFwvtlyPBONlCpPt7XRiz30RI");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process"
    ]
  }
});

// QR Code Event
client.on("qr", async (qr) => {

  console.log("\n================================");
  console.log("📱 QR RECEIVED");
  console.log("Open the link below in browser");
  console.log("================================\n");

  try {

    const qrImage = await QRCode.toDataURL(qr);

    console.log(qrImage);

    console.log("\nSteps:");
    console.log("1. Copy the link above");
    console.log("2. Paste in browser");
    console.log("3. Scan with WhatsApp");
    console.log("WhatsApp → Linked Devices → Link Device\n");

  } catch (err) {
    console.error("QR generation error:", err);
  }

});

// Bot Ready
client.on("ready", () => {
  console.log("=================================");
  console.log("🚀 AI WhatsApp Bot Ready");
  console.log("=================================");
});

// Authentication
client.on("authenticated", () => {
  console.log("✅ WhatsApp Authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Auth Failure:", msg);
});

// Disconnect
client.on("disconnected", (reason) => {
  console.log("⚠️ Client disconnected:", reason);
});

// Message Listener
client.on("message", async (message) => {

  try {

    // Ignore status messages
    if (message.from === "status@broadcast") return;

    // Ignore empty messages
    if (!message.body) return;

    const userMessage = message.body;

    console.log(`📩 Message from ${message.from}:`, userMessage);

    // Show typing indicator
    const chat = await message.getChat();
    chat.sendStateTyping();

    const prompt = `
You are a helpful AI assistant replying on WhatsApp.
Keep answers short, clear and friendly.

User: ${userMessage}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    console.log("🤖 AI Response:", response);

    await message.reply(response);

  } catch (error) {

    console.error("❌ AI Error:", error);

    await message.reply("⚠️ AI is thinking... please try again.");

  }

});

// Start Bot
client.initialize();