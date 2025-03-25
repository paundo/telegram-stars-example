"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const bot = new grammy_1.Bot("8110616423:AAEJcLN6eXqk-geUKsO-lLAcm90kKwUzkCQ");
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));
// Starts the bot and makes it ready to receive updates and process commands.
exports.default = (0, grammy_1.webhookCallback)(bot, "https");
//bot.start();
/*
export default function handler(req, res) {
  if (req.method === "POST") {
    webhookCallback(bot, "express")(req, res);
  } else {
    res.status(200).send("Bot is running.");
  }
}*/
