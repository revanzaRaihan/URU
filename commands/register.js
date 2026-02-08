import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as taskCommand } from './task.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [taskCommand.toJSON()] }
    );
    console.log('Commands registered');
  } catch (err) {
    console.error(err);
  }
})();
