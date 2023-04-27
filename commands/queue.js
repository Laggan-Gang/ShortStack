const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue"),
  async execute(interaction) {
    await interaction.reply({
      content: "This is super not ready yet ",
      ephemeral: true,
    });

    console.log("Nu är vi i interaction grejen");
  },
};
