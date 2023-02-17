// remove this after you've confirmed it is working
import {
  config as dotenvConfig
} from 'dotenv';
import {
  Telegraf
} from 'telegraf'; // .env

import {
  Client, Events, GatewayIntentBits
} from 'discord.js';

import {
  PrismaClient
} from '@prisma/client';

dotenvConfig();

interface TelegramUserEntry
{
  id: number
  chatId: number
  username?: string
}

interface DiscordUserEntry
{
  id: string
  username: string
  discriminator: string
}

interface UserEntry
{
  telegram: TelegramUserEntry
  discord?: DiscordUserEntry
}

const prisma = new PrismaClient();

function main(): void
{
  // Discord init starts here
  const discordBot = new Client({
    // Important, this gives permission/be aware of voice channel states.
    // (in case it's not obvious in the future)
    intents: [GatewayIntentBits.GuildVoiceStates]
  });

  if (process.env.TELEGRAM_BOT_TOKEN === undefined || process.env.DISCORD_BOT_TOKEN === undefined)
  {
    throw new Error(`Environment variables are not defined. Check TELEGRAM_BOT_TOKEN and DISCORD_BOT_TOKEN`);
  }
  const telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  discordBot.once(Events.ClientReady, c =>
  {
    const botName: string = c.user.tag;
    console.log(`Ready! Logged in as ${botName}`);
    // TODO: 👇👇
    // Fetch all data from the database to RAM
  });

  // Log in to Discord with your client's token
  discordBot.login(process.env.DISCORD_BOT_TOKEN);

  discordBot.on(Events.VoiceStateUpdate, async(oldState, newState) =>
  {
    const newUser = newState.member?.user;
    console.log(`Discord: Voice State Update`, newUser?.id, newUser?.username);

    const channelName = newState.channel?.name || oldState.channel?.name || `Tomodachi No Mori (El Bosque de los Amiguitos)`;
    if (!oldState.channelId)
    {
      const subscribedUsers = await prisma.user.findMany();

      for (const userEntry of subscribedUsers)
      {
        const messageIfNickName = `${newState.member?.nickname} (${newUser?.username}) joined ${channelName}`;
        const messageIfOnlyUsername = `${newUser?.username} joined ${channelName}`;
        const telegramMessage = newState.member?.nickname ? (messageIfNickName) : messageIfOnlyUsername;

        // console.log(userEntry, newState.member?.id, newState.member?.id, newState.member?.user.username, newState.member?.user.discriminator);

        await telegramBot.telegram.sendMessage(userEntry.telegramId, telegramMessage);
      }
    }
    if (!newState.channelId)
    {
      // Place code here when someone leaves
    }
  });

  // DISCORD FUNCTIONALITY IS READY FOR US 👆

  telegramBot.command(`subscribe`, async(ctx) =>
  {
    // add the user that wants to subscribe to our custom database
    // if the user is already there, well,  dont add it, it already exists
    // const subcribingChatID: string = ctx.message.chat.id.toString();
    const telegramUser = ctx.message.from;
    console.log(`/subscribe from ${telegramUser.id}:${telegramUser.username ?? ``}`);
    // telegramUser.id => prisma.User.telegramId => postgres.User.telegram_id

    // TODO: Check with our postgres database if the user already exists

    try
    {
      const databaseUser = await prisma.user.findUnique({
        where: {
          telegramId: String(telegramUser.id)
        }
      });
      if (databaseUser == null)
      {
        await prisma.user.create({
          data: {
            telegramId: String(telegramUser.id),
            telegramUsername: telegramUser.username
          }
        });
        await ctx.reply(`Ahora recibiras mensajes cuando alguien entre al canal de voz de nuestro Discord. Para no recibir mensajes que los usuarios se unieron a discord, utiliza el comando:\n/unsubscribe`);
      }
      else
      {
        await ctx.reply(`Morro, ya esta suscrito, no manche, que le pasa?`);
      }
    }
    catch (error)
    {
      console.error(error, telegramUser.username, telegramUser.id);
      console.error(`Subscribe error`);
    }
  });

  telegramBot.command(`unsubscribe`, async(ctx) =>
  {
    const telegramUser = ctx.message.from;
    console.log(`/unsubscribe from ${telegramUser.id}:${telegramUser.username ?? ``}`);
    try
    {
      const databaseUser = await prisma.user.findUnique({
        where: {
          telegramId: String(telegramUser.id)
        }
      });

      // If user exists
      if (databaseUser != null)
      {
        await prisma.user.delete({
          where: {
            telegramId: databaseUser.telegramId
          }
        });
        await ctx.reply(`Ya no se enviaran mensajes de que los usuarios se unieron al canal de discord. Puedes resubscribirte escribiendo:\n/subscribe`);
      }
      else
      {
        await ctx.reply(`Este usuario no esta subscrito al servicio.`);
      }
    }
    catch (error)
    {
      console.error(error, telegramUser.username, telegramUser.id);
      console.error(`Unsubcribe error`);
      await ctx.reply(`Error al desuscribirse al servicio. Contacte a los Developers.`);
    }
  });

  telegramBot.launch();

  // Enable graceful stop
  process.once(`SIGINT`, () => telegramBot.stop(`SIGINT`));
  process.once(`SIGTERM`, () => telegramBot.stop(`SIGTERM`));
}

main();
