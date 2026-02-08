import http from 'http';
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  Collection,
} from 'discord.js';

import { data as taskData, execute as taskExecute } from './commands/task.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// COMMAND COLLECTION
client.commands = new Collection();
client.commands.set(taskData.name, {
  data: taskData,
  execute: taskExecute,
});

// GLOBAL TASK STORE
global.taskStore = new Map();

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) return;
    await interaction.reply({
      content: '❌ Internal error',
      ephemeral: true,
    });
  }
});

const port = process.env.PORT || 8000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
}).listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

client.login(process.env.DISCORD_TOKEN);