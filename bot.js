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
      "--disable-dev-shm-usage"
    ]
  }
});

// QR Code
client.on("qr", (qr) => {
  console.log("Scan the QR Code below:");
  qrcode.generate(qr, { small: true });
});

// Bot Ready
client.on("ready", () => {
  console.log("AI WhatsApp Bot Ready 🚀");
});

// Message Listener
client.on("message", async (message) => {

  // Ignore status messages
  if (message.from === "status@broadcast") return;

  const userMessage = message.body;

  try {

    const result = await model.generateContent(userMessage);

    const response = result.response.text();

    await message.reply(response);

  } catch (error) {

    console.error(error);

    message.reply("⚠️ AI is thinking... try again.");

  }

});

// Start bot
client.initialize();