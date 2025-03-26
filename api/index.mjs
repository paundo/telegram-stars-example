import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import {getURL} from "vercel-grammy"

const url = getURL({path: "api/index"})

//dotenv.config();

//const bot = new Bot(process.env.BOT_TOKEN);
const bot = new Bot("8110616423:AAEJcLN6eXqk-geUKsO-lLAcm90kKwUzkCQ");

const paidUsers = new Map();

const ITEMS = {
  ice_cream: {
    name: "Ice Cream 🍦",
    price: 1, // cijena u jedinicama (1 = 1 XTR)
    description: "A delicious virtual ice cream",
    secret: "FROZEN2025"
  },
  cookie: {
    name: "Cookie 🍪",
    price: 3,
    description: "A sweet virtual cookie",
    secret: "SWEET2025"
  },
  hamburger: {
    name: "Hamburger 🍔",
    price: 5,
    description: "A tasty virtual hamburger",
    secret: "BURGER2025"
  }
};

const MESSAGES = {
  welcome: "Welcome to the Digital Store! 🎉\nSelect an item to purchase with Telegram Stars:",
  help: `🛍 *Digital Store Bot Help*
  
Commands:
/start - View available items
/help - Show this help message
/status - Check payment status
/refund - Request a refund (requires transaction ID)`,
  refund_success: "✅ Refund processed successfully!\nThe Stars have been returned to your balance.",
  refund_failed: "❌ Refund could not be processed.\nPlease try again later or contact support.",
  refund_usage: "Please provide the transaction ID after the /refund command.\nExample: `/refund YOUR_TRANSACTION_ID`"
};

// /start – prikazuje tastaturu sa artiklima
bot.command("start", (ctx) => {
  const keyboard = new InlineKeyboard();
  for (const itemId in ITEMS) {
    const item = ITEMS[itemId];
    keyboard.text(`${item.name} - ${item.price} ⭐`, itemId).row();
  }
  return ctx.reply(MESSAGES.welcome, { reply_markup: keyboard });
});

// /help – prikazuje help poruku
bot.command("help", (ctx) => ctx.reply(MESSAGES.help, { parse_mode: "Markdown" }));

// /pay – test komanda za slanje fakture
bot.command("pay", (ctx) => {
  return ctx.replyWithInvoice(
    "Test Product",                  // Product name
    "Test description",              // Product description
    "{}",                            // Payload (može biti prazan JSON string ili neki identifikator)
    "XTR",                           // Currency
    [{ amount: 100, label: "Test Product" }] // Cijena u najmanjim jedinicama (npr. 100 = 1 XTR ako je 1 XTR = 100 jedinica)
  );
});

// Callback handler – kada korisnik pritisne dugme na tastaturi
bot.on("callback_query:data", async (ctx) => {
  const itemId = ctx.callbackQuery.data;
  const item = ITEMS[itemId];
  if (!item) return;

  try {
    await ctx.answerCallbackQuery();
    // Koristi replyWithInvoice za slanje fakture
    await ctx.replyWithInvoice(
      item.name,
      item.description,
      itemId, // Payload – ovdje se koristi itemId
      "XTR",
      [{ amount: item.price, label: item.name }],
      { start_parameter: "start_parameter" }
    );
  } catch (error) {
    console.error("Error in button handler:", error);
    await ctx.reply("Sorry, something went wrong while processing your request.");
  }
});

// Pre-checkout query – Telegram traži potvrdu prije plaćanja
bot.on("pre_checkout_query", (ctx) => {
  // Ako payload iz fakture odgovara jednom od artikala, potvrdi plaćanje
  const isValid = ITEMS.hasOwnProperty(ctx.preCheckoutQuery.invoice_payload);
  return ctx.answerPreCheckoutQuery(isValid, isValid ? undefined : "Something went wrong...");
});

// Kada se plaćanje uspješno izvrši, sačuvaj podatke i prikaži secret kod
bot.on("message:successful_payment", (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) return;
  
  const payment = ctx.message.successful_payment;
  const itemId = payment.invoice_payload;
  const item = ITEMS[itemId];
  
  // Čuvamo ID plaćanja
  paidUsers.set(ctx.from.id, payment.telegram_payment_charge_id);
  console.log("Successful payment:", payment);
  
  return ctx.reply(
    `Uspešno ste platili uslugu!\n\n` +
    `Tajni kod za ${item.name} je: *${item.secret}*\n\n` +
    `Čuvajte ovu poruku za eventualan refund.`
  );
});

// /status – provjerava status plaćanja
bot.command("status", (ctx) => {
  const message = paidUsers.has(ctx.from.id)
    ? "You have paid"
    : "You have not paid yet";
  return ctx.reply(message);
});

// /refund – pokreće refund ako je korisnik platio
bot.command("refund", (ctx) => {
  const userId = ctx.from.id;
  if (!paidUsers.has(userId)) {
    return ctx.reply("You have not paid yet, there is nothing to refund");
  }
  return ctx.api
    .refundStarPayment(userId, paidUsers.get(userId))
    .then(() => {
      paidUsers.delete(userId);
      return ctx.reply("Refund successful");
    })
    .catch(() => ctx.reply("Refund failed"));
});

// Pokretanje bota
//bot.start();

export default await bot.api.setWebhook(url)
//export default webhookCallback(bot, "https")
