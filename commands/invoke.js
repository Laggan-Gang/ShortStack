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
    const unreadiedArr = [...queue.data];
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
      i.customId === "rdyQueue" && unreadiedArr.includes(i.user.toString());
    //const filter = (i) => true;
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: 5 * 1000,
      max: queue.data.length,
    });
    collector.on("collect", async (i) => {
      readiedArr.push(i.user.toString());
      message.edit(updateMessage(unreadiedArr, readiedArr));
      const queuerIndex = unreadiedArr.indexOf(i.user.toString());
      if (queuerIndex > -1) {
        unreadiedArr.splice(queuerIndex, 1);
      }
      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      try {
        message.edit({
          content: `For now the queue is pretty simple. ${unreadiedArr.join(
            ", "
          )} you need to re-queue manually after this invocation. \n \n The original quque-order was ${queue.data.join(
            " > "
          )}`,
          components: [],
        });
      } catch (error) {
        message.edit("There was an error baby  " + error);
        console.log(error);
      }
    });
  },
};

updateMessage = (unreadiedArr, readiedArr) => {
  return `${unreadiedArr.join(
    ", "
  )} you are being summoned. \n ${readiedArr.join(
    ", "
  )} you have been confirmed ready.`;
};
