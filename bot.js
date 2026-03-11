const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
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
client.on("qr", (qr) => {

  console.log("\n==============================");
  console.log("📱 SCAN THIS QR CODE");
  console.log("WhatsApp → Linked Devices → Link Device");
  console.log("==============================\n");

  qrcode.generate(qr, { small: false });

});

// Ready Event
client.on("ready", () => {

  console.log("=================================");
  console.log("🚀 AI WhatsApp Bot is READY");
  console.log("=================================");

});

// Authentication
client.on("authenticated", () => {
  console.log("✅ WhatsApp Authenticated");
});

client.on("auth_failure", msg => {
  console.error("❌ Authentication Failed:", msg);
});

// Disconnect
client.on("disconnected", (reason) => {
  console.log("⚠️ Client disconnected:", reason);
});

// Message Listener
client.on("message", async (message) => {

  try {

    // Ignore status
    if (message.from === "status@broadcast") return;

    // Ignore empty messages
    if (!message.body) return;

    const userMessage = message.body;

    console.log(`📩 Message from ${message.from}:`, userMessage);

    // Show typing indicator
    const chat = await message.getChat();
    chat.sendStateTyping();

    // AI Prompt (improves responses)
    const prompt = `
You are a helpful AI assistant replying on WhatsApp.
Be friendly, short and clear.

User message:
${userMessage}
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