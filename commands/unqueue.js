const { SlashCommandBuilder } = require("discord.js");
const { helpMeLittleHelper } = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unqueue")
    .setDescription("Uh oh it's donut time"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "delete");
    console.log(queue.data);
    await interaction.reply({
      content: "The queue looks like this: \n" + queue.data.join("\n"),
      ephemeral: true,
    });
  },
};
