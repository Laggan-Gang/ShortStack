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

    //const filter = (i) =>
    //  i.channel.id === message.channelId &&
    //  i.customId === "rdyQueue" &&
    //  unreadiedArr.includes(i.user.id.toString());
    const filter = (i) => true;
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: 5 * 1000,
      max: unreadiedArr.length,
    });
    collector.on("collect", async (i) => {
      console.log("Hela i");
      console.log(i);
      console.log("i.user.username här");
      console.log(i.user.username);
      console.log("message.channelId här");
      console.log(message.channelId);
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
