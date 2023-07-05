const { SlashCommandBuilder } = require("discord.js");
const { helpMeLittleHelper } = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unqueue")
    .setDescription("Uh oh it's donut time"),
  async execute(interaction) {
    await interaction.reply({
      content: `Roger...`,
      ephemeral: false,
    });
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "delete");
    const message = await interaction.fetchReply();
    await message.edit({
      content: `The queue looks like this: \n${queue.data.join("\n")}`,
    });
  },
};
