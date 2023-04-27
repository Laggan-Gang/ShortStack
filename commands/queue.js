const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue"),
  async execute(interaction) {
    await interaction.reply({
      content: "You're in Q position: ",
      ephemeral: true,
    });

    console.log("Nu är vi i interaction grejen");
  },
};
