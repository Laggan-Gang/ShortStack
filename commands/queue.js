const { SlashCommandBuilder } = require("discord.js");
const helpMeLittleHelper = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "post");
    console.log(queue.data);
    await interaction.reply({
      content: "The queue looks like this: \n" + queue.data.join("\n"),
      ephemeral: true,
    });
  },
};
