// remove this after you've confirmed it is working
import {
  config as dotenvConfig
} from 'dotenv';

import {
  Client, Events, GatewayIntentBits
} from 'discord.js';

dotenvConfig();
const client = new Client({
  // Important, this gives permission/be aware of voice channel states.
  // (in case it's not obvious in the future)
  intents: [GatewayIntentBits.GuildVoiceStates]
});

client.once(Events.ClientReady, c =>
{
  const botName: string = c.user.tag;
  console.log(`Ready! Logged in as ${botName}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);

client.on(Events.VoiceStateUpdate, async(oldState, newState) =>
{
  // const foo = await newState.guild.members.list({
  //   cache: true
  // });
  // console.log(`list`, foo);
  console.log(newState.member?.nickname, newState.member?.user.username);
  console.log(`memberCount`, newState.guild.memberCount);
});
