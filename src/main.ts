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
  writeFileSync, readFileSync, existsSync as fileExistsSync
} from 'fs';

dotenvConfig();
// Up to this point, environment variables are loaded from the OS to our program

// creating a CUSTOM TYPE
interface TelegramUserEntry
{
  id: number
  chatId: number
  username?: string
}
const pathToDatabase: string = `./user-subscriptions.db`;
let database: TelegramUserEntry[] = [];

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
    return;
  }
  const telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  discordBot.once(Events.ClientReady, c =>
  {
    const botName: string = c.user.tag;
    console.log(`Ready! Logged in as ${botName}`);
    if (!fileExistsSync(pathToDatabase))
    {
      writeFileSync(pathToDatabase, ``, `utf-8`);
    }

    const rawStringDatabase = readFileSync(pathToDatabase, `utf-8`);
    database = JSON.parse(rawStringDatabase) as TelegramUserEntry[];
  });

  // Log in to Discord with your client's token
  discordBot.login(process.env.DISCORD_BOT_TOKEN);

  discordBot.on(Events.VoiceStateUpdate, async(oldState, newState) =>
  {
    const newUser = oldState.member?.user;
    // const oldUser = oldState.member?.user;
    // const debugObject = {
    //   oldState: {
    //     channelId: oldState.channelId,
    //     user: oldUser?.username,
    //     isStreaming: oldState.streaming,
    //     isMuted: oldState.mute
    //   },
    //   newState: {
    //     channelId: newState.channelId,
    //     user: newUser?.username,
    //     isStreaming: newState.streaming,
    //     isMuted: newState.mute
    //   }
    // };
    // console.log(debugObject);
    if (!oldState.channelId)
    {
      for (const telegramUserEntry of database)
      {
        const messageIfNickName = `${newState.member?.nickname} (${newUser?.username}) joined Favelita`;
        const messageIfOnlyUsername = `${newUser?.username} joined Favelita`;
        const telegramMessage = newState.member?.nickname ? (messageIfNickName) : messageIfOnlyUsername;
        await telegramBot.telegram.sendMessage(telegramUserEntry.chatId, telegramMessage);
      }
    }
    if (!newState.channelId)
    {
      // console.log(`someone left`);
    }

    // console.log(`newState is`, newState.member?.);
    console.log(`~~~~~~ ~~~~~~~~~~~~~~`);
  });

  // DISCORD FUNCTIONALITY IS READY FOR US
  telegramBot.hears(`hi`, async(ctx) => await ctx.reply(`Hey there`));
  telegramBot.hears(`subscribe`, async(ctx) =>
  {
    // add the user that wants to subscribe to our custom database
    // if the user is already there, well,  dont add it, it already exists
    const subcribingChatID: number = ctx.message.chat.id;
    const telegramUser = ctx.message.from;
    const isUserInDatabase = database.find(userEntry => userEntry.chatId === subcribingChatID);
    console.log(isUserInDatabase);
    if (isUserInDatabase != null)
    {
      await ctx.reply(`Morro, ya esta suscrito, no manche, que le pasa?`);
      return;
    }

    database.push({
      chatId: subcribingChatID, id: telegramUser.id, username: telegramUser.username
    });

    writeFileSync(pathToDatabase, JSON.stringify(database, null, 4), `utf-8`);

    await ctx.reply(`Ahora recibiras mensajes cuando alguien entre al canal de voz de nuestro Discord`);
  });

  telegramBot.launch();

  // Enable graceful stop
  process.once(`SIGINT`, () => telegramBot.stop(`SIGINT`));
  process.once(`SIGTERM`, () => telegramBot.stop(`SIGTERM`));
}

main();
