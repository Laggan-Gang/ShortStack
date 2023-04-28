const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { helpMeLittleHelper } = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invoke")
    .setDescription("Time to invoke the queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "get");
    const unreadiedArr = queue.data;
    const readiedArr = [];
    console.log(unreadiedArr);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rdyQueue")
        .setLabel("✅")
        .setStyle(ButtonStyle.Success)
    );
    await interaction.reply({
      content: `${queue.data.join(", ")} you are being summoned.`,
      components: [buttonRow],
    });
    const message = await interaction.fetchReply();

    const filter = (i) =>
      i.channel.id === message.channel.id &&
      i.customId === "rdyQueue" &&
      unreadiedArr.includes(i.user.id.toString());
    console.log(message);
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: pickTime * 1000, //NEED NEW PICK TIME (fem minuter)
      max: 1,
    });
    collector.on("collect", async (i) => {
      console.log(i);
      console.log(i.user.username);
      //The interaction will be "failed" unless we do something with it

      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      try {
      } catch (error) {
        message.edit("There was an error baby  " + error);
        console.log(error);
      }
    });
  },
};
