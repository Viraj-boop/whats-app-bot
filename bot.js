const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI("AIzaSyDRQ3rFmOiFwvtlyPBONlCpPt7XRiz30RI")

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const client = new Client()

client.on('qr', (qr) => {
 qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
 console.log("AI WhatsApp Bot Ready 🚀")
})

client.on('message', async message => {

 const userMessage = message.body

 try {

 const result = await model.generateContent(userMessage)

 const response = result.response.text()

 message.reply(response)

 } catch (error) {

 message.reply("AI is thinking... try again.")

 }

})

client.initialize()