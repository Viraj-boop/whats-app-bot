require('dotenv').config(); // Loads your API key from .env
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode-terminal");
const fs = require("fs-extra");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// 1. Initialize with the key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Using Gemini 2.0 Flash - the 2026 stable model
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
});

let leads = [];
const LEADS_FILE = "leads.json";
if (fs.existsSync(LEADS_FILE)) { leads = fs.readJsonSync(LEADS_FILE); }
const saveLeads = () => fs.writeJsonSync(LEADS_FILE, leads, { spaces: 2 });

client.on("qr", (qr) => {
    console.log("Scan the QR code below:");
    QRCode.generate(qr, { small: true });
});

client.on("ready", () => console.log("AI WhatsApp Bot Ready 🚀"));

client.on("message", async (message) => {
    if (message.from === "status@broadcast" || message.from.includes("@g.us")) return;

    const userNumber = message.from;
    const text = message.body;
    let lead = leads.find(l => l.number === userNumber);

    // Lead Capture Logic
    if (!lead) {
        lead = { number: userNumber, name: null, requirement: null };
        leads.push(lead);
        saveLeads();
        return await message.reply("👋 Welcome! May I know your *name* to get started?");
    }
    if (!lead.name) {
        lead.name = text;
        saveLeads();
        return await message.reply(`Nice to meet you *${lead.name}*! What service can we help you with?`);
    }
    if (!lead.requirement) {
        lead.requirement = text;
        saveLeads();
        return await message.reply("✅ Got it! Our team will contact you. You can chat with me in the meantime.");
    }

    // AI Chat logic
    try {
        const result = await model.generateContent(`User: ${lead.name}\nRequirement: ${lead.requirement}\nQuery: ${text}`);
        const response = await result.response;
        await message.reply(response.text());
    } catch (error) {
        console.error("Critical Error:", error.message);
        await message.reply("I'm refreshing my connection. Please try again in a moment!");
    }
});

client.initialize();