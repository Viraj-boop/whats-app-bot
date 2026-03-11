const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const fs = require("fs-extra");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Use your NEW API Key here
const genAI = new GoogleGenerativeAI("AIzaSyDawEI8Em8uAnX__bEwisMzNiLIiITG_qo");

// 2. Use the stable 'gemini-1.5-flash' name
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
});

// ... rest of your client setup ...


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

// Load existing leads
let leads = [];

if (fs.existsSync("leads.json")) {
  leads = fs.readJsonSync("leads.json");
}

// QR
client.on("qr", async (qr) => {
  const qrImage = await QRCode.toDataURL(qr);
  console.log("Open this in browser and scan:");
  console.log(qrImage);
});

// Ready
client.on("ready", () => {
  console.log("AI WhatsApp Bot Ready 🚀");
});

// Message
client.on("message", async (message) => {

  if (message.from === "status@broadcast") return;

  const userNumber = message.from;
  const text = message.body;

  let lead = leads.find(l => l.number === userNumber);

  // If new lead
  if (!lead) {

    lead = {
      number: userNumber,
      name: null,
      requirement: null
    };

    leads.push(lead);

    await message.reply(
      "👋 Welcome! Before we continue, may I know your *name*?"
    );

    return;
  }

  // Capture name
  if (!lead.name) {

    lead.name = text;

    await message.reply(
      `Nice to meet you ${lead.name}! 😊\nWhat service are you looking for?`
    );

    return;
  }

  // Capture requirement
  if (!lead.requirement) {

    lead.requirement = text;

    fs.writeJsonSync("leads.json", leads, { spaces: 2 });

    await message.reply(
      "✅ Thank you! Our team will contact you shortly.\nMeanwhile you can ask me anything."
    );

    return;
  }

  // AI reply
  const result = await model.generateContent(text);
  const response = result.response.text();

  await message.reply(response);

});

// Start
client.initialize();