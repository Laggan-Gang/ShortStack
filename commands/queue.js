const { SlashCommandBuilder } = require("discord.js");
const { helpMeLittleHelper } = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Add someone else to queue?")
        .setRequired(false)
    ),
  async execute(interaction) {
    let queuer = { id: interaction.options.getUser("target")?.toString() };
    if (!queuer) {
      queuer = { id: interaction.user.toString() };
    }
    const queue = await helpMeLittleHelper(queuer, "post");
    console.log(queue.data);
    await interaction.reply({
      content: `Roger...`,
      ephemeral: false,
    });
    const message = await interaction.fetchReply();
    await message.edit({
      content: `The queue looks like this: \n${queue.data.join("\n")}`,
    });
  },
};
