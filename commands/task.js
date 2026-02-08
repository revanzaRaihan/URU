import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('task')
  .setDescription('Task management')
  // --- ADD ---
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add new task')
      .addStringOption((opt) =>
        opt.setName('text').setDescription('Task description').setRequired(true)
      )
  )
  // --- LIST ---
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('Show all tasks')
  )
  // --- MODIFY ---
  .addSubcommand((sub) =>
    sub
      .setName('modify')
      .setDescription('Edit an existing task')
      .addIntegerOption((opt) =>
        opt
          .setName('number')
          .setDescription('Task number to modify')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('new_text')
          .setDescription('New task description')
          .setRequired(true)
      )
  )
  // --- DONE ---
  .addSubcommand((sub) =>
    sub
      .setName('done')
      .setDescription('Mark a task as done (removes it)')
      .addIntegerOption((opt) =>
        opt
          .setName('number')
          .setDescription('Task number to mark done')
          .setRequired(true)
      )
  )
  // --- DELETE ---
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Delete a task')
      .addIntegerOption((opt) =>
        opt
          .setName('number')
          .setDescription('Task number to delete')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  if (!interaction.channel.isThread()) {
    return interaction.reply({
      content: '❌ This command can only be used inside a project thread.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const threadId = interaction.channel.id;
  const userId = interaction.user.id;

  // Initialize store if missing
  if (!global.taskStore.has(threadId)) {
    global.taskStore.set(threadId, new Map());
  }

  const threadTasks = global.taskStore.get(threadId);

  if (!threadTasks.has(userId)) {
    threadTasks.set(userId, []);
  }

  const sub = interaction.options.getSubcommand();
  const tasks = threadTasks.get(userId);

  // --- LOGIC: ADD ---
  if (sub === 'add') {
    const text = interaction.options.getString('text');
    tasks.push(text);
  }

  // --- LOGIC: MODIFY ---
  if (sub === 'modify') {
    const number = interaction.options.getInteger('number');
    const newText = interaction.options.getString('new_text');

    if (tasks.length === 0) {
      return interaction.editReply('❌ You have no tasks to modify.');
    }
    if (number < 1 || number > tasks.length) {
      return interaction.editReply(`❌ Invalid task number. Choose 1-${tasks.length}.`);
    }

    tasks[number - 1] = newText;
  }

  // --- LOGIC: DONE / DELETE ---
  if (sub === 'done' || sub === 'delete') {
    const number = interaction.options.getInteger('number');

    if (tasks.length === 0) {
      return interaction.editReply('❌ You have no tasks.');
    }
    if (number < 1 || number > tasks.length) {
      return interaction.editReply(`❌ Invalid task number. Choose 1-${tasks.length}.`);
    }

    tasks.splice(number - 1, 1);
  }

  // --- OUTPUT GENERATOR (Used by List, Add, Modify, Done, Delete) ---
  let output = '**📋 JOB LIST**\n\n';

  // Sort: Current user first, then others
  const sortedEntries = [...threadTasks.entries()].sort((a, b) => {
    if (a[0] === userId) return -1;
    if (b[0] === userId) return 1;
    return 0;
  });

  for (const [uid, userTasks] of sortedEntries) {
    if (userTasks.length === 0) continue;

    output += `**<@${uid}>:**\n`;
    userTasks.forEach((t, i) => {
      output += `${i + 1}. ${t}\n`;
    });
    output += '\n';
  }

  if (output.trim() === '**📋 JOB LIST**') {
    output += '_No remaining tasks._';
  }

  await interaction.editReply(output);
}