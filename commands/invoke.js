const { SlashCommandBuilder } = require("discord.js");
const { helpMeLittleHelper } = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invoke")
    .setDescription("Time to invoke the queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "get");
    console.log(queue.data);
    await interaction.reply({
      content: `${queue.data.join(", ")} you are being summoned.`,
    });
  },
};
