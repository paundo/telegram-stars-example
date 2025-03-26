import { Bot, webhookCallback } from "grammy";
import { getURL } from "vercel-grammy";

const url = getURL({ path: "api/index" });

const bot = new Bot("8110616423:AAEJcLN6eXqk-geUKsO-lLAcm90kKwUzkCQ");

// Map to track paid users and which game they paid for
const paidUsers = new Map();

/*
    Handles the /start command.
    Sends a welcome message to the user and explains the available commands for interacting with the bot.
*/
bot.command("start", (ctx) =>
  ctx.reply(
    `Welcome! I am a simple bot that can accept payments via Telegram Stars. The following commands are available:

/1 - Get a prediction for Real Madrid vs Barcelona (pay for this)
/2 - Get a prediction for Chelsea vs Liverpool (pay for this)
/status - Check if you've paid
/refund - Request a refund`
  )
);

/*
    Handles the /1 command.
    This will generate an invoice for Real Madrid vs Barcelona prediction.
*/
bot.command("1", (ctx) => {
  return ctx.replyWithInvoice(
    "Prognoza utakmice Real Madrid - Barselona", // Product name
    "Plaćanje za prognozu utakmice Real Madrid - Barselona", // Product description
    "pay1",  // Payload to identify this payment
    "XTR", // Currency
    [{ amount: 1, label: "Prognoza utakmice Real Madrid - Barselona" }] // Price breakdown (1 XTR)
  );
});

/*
    Handles the /2 command.
    This will generate an invoice for Chelsea vs Liverpool prediction.
*/
bot.command("2", (ctx) => {
  return ctx.replyWithInvoice(
    "Prognoza utakmice Čelzi - Liverpul", // Product name
    "Plaćanje za prognozu utakmice Čelzi - Liverpul", // Product description
    "pay2",  // Payload to identify this payment
    "XTR", // Currency
    [{ amount: 1, label: "Prognoza utakmice Čelzi - Liverpul" }] // Price breakdown (1 XTR)
  );
});

/*
    Handles the pre_checkout_query event.
    Responds to Telegram when a user clicks the payment button.
*/
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch(() => {
    console.error("answerPreCheckoutQuery failed");
  });
});

/*
    Handles the message:successful_payment event.
    This event is triggered when a payment is successfully processed.
    Updates the paidUsers map to record the payment details and logs the successful payment.
*/
bot.on("message:successful_payment", (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  // Determine which game the user paid for
  if (ctx.message.successful_payment.invoice_payload === "pay1") {
    paidUsers.set(ctx.from.id, "real_madrid_barselona"); // User paid for Real Madrid vs Barcelona prediction
  } else if (ctx.message.successful_payment.invoice_payload === "pay2") {
    paidUsers.set(ctx.from.id, "chelsea_liverpool"); // User paid for Chelsea vs Liverpool prediction
  }

  console.log("Payment received: ", ctx.message.successful_payment); // Logs payment details
});

/*
    Handles the /status command.
    Checks if the user has made a payment and responds with their payment status.
*/
bot.command("status", (ctx) => {
  const message = paidUsers.has(ctx.from.id)
    ? "You have paid and can access the prediction."  // User has paid
    : "You have not paid yet. Please make a payment to access the prediction.";  // User has not paid
  return ctx.reply(message);
});

/*
    Handles the /refund command.
    Refunds the payment made by the user if applicable. If the user hasn't paid, informs them that no refund is possible.
*/
bot.command("refund", (ctx) => {
  const userId = ctx.from.id;
  if (!paidUsers.has(userId)) {
    return ctx.reply("You have not paid yet, there is nothing to refund.");
  }

  // Refund logic (if applicable with your payment processor)
  // This part is just a placeholder, as refunding depends on the specific system you are using
  // Example: Refund via the Telegram Stars API or other payment processors
  ctx.api
    .refundStarPayment(userId, paidUsers.get(userId)) // Assuming this is a valid refund call
    .then(() => {
      paidUsers.delete(userId); // Removes the user from the paidUsers map
      return ctx.reply("Refund successful.");
    })
    .catch(() => {
      return ctx.reply("Refund failed. Please contact support.");
    });
});

/*
    Handles the /1 command after payment.
    This will return the prediction for Real Madrid vs Barcelona if the user has paid for it.
*/
bot.command("1", (ctx) => {
  // Check if the user has paid for Real Madrid vs Barcelona
  if (paidUsers.get(ctx.from.id) === "real_madrid_barselona") {
    return ctx.reply("Prognoza utakmice Real Madrid - Barselona: Real Madrid će pobediti!");
  } else {
    return ctx.reply("You need to make a payment for Real Madrid vs Barcelona prediction first.");
  }
});

/*
    Handles the /2 command after payment.
    This will return the prediction for Chelsea vs Liverpool if the user has paid for it.
*/
bot.command("2", (ctx) => {
  // Check if the user has paid for Chelsea vs Liverpool
  if (paidUsers.get(ctx.from.id) === "chelsea_liverpool") {
    return ctx.reply("Prognoza utakmice Čelzi - Liverpul: Čelzi će pobediti!");
  } else {
    return ctx.reply("You need to make a payment for Chelsea vs Liverpool prediction first.");
  }
});

export default webhookCallback(bot, "https");
