import { Bot, InlineKeyboard, webhookCallback } from "grammy";
//import dotenv from "dotenv";
import { getURL } from "vercel-grammy";

//dotenv.config();

//const bot = new Bot(process.env.BOT_TOKEN);
const bot = new Bot("8110616423:AAEJcLN6eXqk-geUKsO-lLAcm90kKwUzkCQ");
const url = getURL({ path: "api/index" });

const ITEMS = {
  ice_cream: {
    name: "Ice Cream 🍦",
    price: 1,
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
  help: "🛍 *Digital Store Bot Help*\n\nCommands:\n/start - View available items\n/help - Show this help message\n/refund - Request a refund (requires transaction ID)\n\nHow to use:\n1. Use /start to see available items\n2. Click on an item to purchase\n3. Pay with Stars\n4. Receive your secret code\n5. Use /refund to get a refund if needed",
  refund_success: "✅ Refund processed successfully!\nThe Stars have been returned to your balance.",
  refund_failed: "❌ Refund could not be processed.\nPlease try again later or contact support.",
  refund_usage: "Please provide the transaction ID after the /refund command.\nExample: `/refund YOUR_TRANSACTION_ID`"
};

const STATS = {
  purchases: new Map(),
  refunds: new Map()
};

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard();
  
  for (const itemId in ITEMS) {
    const item = ITEMS[itemId];
    keyboard.text(`${item.name} - ${item.price} ⭐`, itemId).row();
  }
  
  await ctx.reply(MESSAGES.welcome, {
    reply_markup: keyboard
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(MESSAGES.help, { parse_mode: "Markdown" });
});

bot.command("status", async (ctx) => {
  const message = STATS.purchases.has(ctx.from.id)
    ? "You have paid."
    : "You have not paid yet.";
  await ctx.reply(message);
});

bot.command("refund", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) {
    return ctx.reply(MESSAGES.refund_usage);
  }

  const chargeId = args[0];
  const userId = ctx.from.id;

  try {
    const success = await bot.api.refundStarPayment(userId, chargeId);
    if (success) {
      STATS.refunds.set(userId, (STATS.refunds.get(userId) || 0) + 1);
      await ctx.reply(MESSAGES.refund_success);
    } else {
      await ctx.reply(MESSAGES.refund_failed);
    }
  } catch (error) {
    console.error("Refund error:", error);
    await ctx.reply(`❌ Error processing refund: ${error.message}`);
  }
});

bot.on("callback_query:data", async (ctx) => {
  const itemId = ctx.callbackQuery.data;
  const item = ITEMS[itemId];
  
  if (!item) return;
  
  try {
    await ctx.answerCallbackQuery();
    
    await ctx.api.sendInvoice(ctx.from.id, {
      title: item.name,
      description: item.description,
      payload: itemId,
      provider_token: "", // Empty for digital goods
      currency: "XTR",
      prices: [{ label: item.name, amount: item.price }],
      start_parameter: "start_parameter"
    });
  } catch (error) {
    console.error("Error in button handler:", error);
    await ctx.reply("Sorry, something went wrong while processing your request.");
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  const isValid = ITEMS.hasOwnProperty(ctx.preCheckoutQuery.invoice_payload);
  await ctx.answerPreCheckoutQuery(isValid, isValid ? undefined : "Something went wrong...");
});

bot.on("successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  const itemId = payment.invoice_payload;
  const item = ITEMS[itemId];
  const userId = ctx.from.id;

  STATS.purchases.set(userId, (STATS.purchases.get(userId) || 0) + 1);

  console.log(`Successful payment from user ${userId} for item ${itemId}`);

  await ctx.reply(
    `Thank you for your purchase! 🎉\n\nHere's your secret code for ${item.name}:\n\`${item.secret}\`\n\nTo get a refund, use this command:\n\`/refund ${payment.telegram_payment_charge_id}\`\n\nSave this message to request a refund later if needed.`,
    { parse_mode: "Markdown" }
  );
});

bot.catch((err) => {
  console.error("Bot encountered an error:", err);
});

export default webhookCallback(bot, "https");
