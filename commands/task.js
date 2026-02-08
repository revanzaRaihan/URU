import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('task')
  .setDescription('Task management')
  .addSubcommand(sub =>
    sub
      .setName('add')
      .setDescription('Add new task')
      .addStringOption(opt =>
        opt
          .setName('text')
          .setDescription('Task description')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('done')
      .setDescription('Mark a task as done')
      .addIntegerOption(opt =>
        opt
          .setName('number')
          .setDescription('Task number to mark as done')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  // THREAD ONLY
  if (!interaction.channel.isThread()) {
    return interaction.reply({
      content: '❌ This command can only be used inside a project thread.',
      ephemeral: true,
    });
  }

  const threadId = interaction.channel.id;
  const userId = interaction.user.id;

  // INIT THREAD
  if (!global.taskStore.has(threadId)) {
    global.taskStore.set(threadId, new Map());
  }

  const threadTasks = global.taskStore.get(threadId);

  // INIT USER
  if (!threadTasks.has(userId)) {
    threadTasks.set(userId, []);
  }

  const sub = interaction.options.getSubcommand();

  // =====================
  // ADD TASK
  // =====================
  if (sub === 'add') {
    const text = interaction.options.getString('text');
    threadTasks.get(userId).push(text);
  }

  // =====================
  // DONE TASK
  // =====================
  if (sub === 'done') {
    const number = interaction.options.getInteger('number');
    const tasks = threadTasks.get(userId);

    if (tasks.length === 0) {
      return interaction.reply({
        content: '❌ You have no tasks.',
        ephemeral: true,
      });
    }

    if (number < 1 || number > tasks.length) {
      return interaction.reply({
        content: '❌ Invalid task number.',
        ephemeral: true,
      });
    }

    // REMOVE TASK (1-based index)
    tasks.splice(number - 1, 1);
  }

  // =====================
  // BUILD JOB LIST
  // =====================
  let output = '**📋 JOB LIST**\n\n';

  for (const [uid, tasks] of threadTasks.entries()) {
    if (tasks.length === 0) continue;

    const user = await interaction.client.users.fetch(uid);
    output += `**@${user.username}:**\n`;

    tasks.forEach((t, i) => {
      output += `${i + 1}. ${t}\n`;
    });

    output += '\n';
  }

  if (output.trim() === '**📋 JOB LIST**') {
    output += '_No remaining tasks._';
  }

  await interaction.reply(output);
}
