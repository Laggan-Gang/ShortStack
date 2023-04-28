const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { helpMeLittleHelper, getTimestamp } = require("../utils");

const READYTIME = 5 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invoke")
    .setDescription("Time to invoke the queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "get");
    if (queue.data.length < 1) {
      interaction.reply(`There's no one in the queue, bozo`);
    }
    const unreadiedArr = [...queue.data];
    const readiedArr = [];

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rdyQueue")
        .setLabel("✅")
        .setStyle(ButtonStyle.Success)
    );
    const time = getTimestamp(1000);
    await interaction.reply({
      content: `${queue.data.join(
        ", "
      )} you are being summoned. Your time to show ends <t:${
        time + READYTIME
      }:R>`,
      components: [buttonRow],
    });
    const message = await interaction.fetchReply();

    const filter = (i) =>
      i.customId === "rdyQueue" && unreadiedArr.includes(i.user.toString());
    const collector = await message.channel.createMessageComponentCollector({
      filter,
      time: READYTIME,
      max: queue.data.length,
    });
    collector.on("collect", async (i) => {
      console.log(i.user.username);
      console.log(i);
      console.log(queue.data);
      console.log(queue.data.length);
      readiedArr.push(i.user.toString());
      const queuerIndex = unreadiedArr.indexOf(i.user.toString());
      if (queuerIndex > -1) {
        unreadiedArr.splice(queuerIndex, 1);
      }
      await message.edit(updateMessage(unreadiedArr, readiedArr));

      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      console.log(collected);
      try {
        message.edit({
          content: `For now the queue is pretty simple. ${unreadiedArr.join(
            ", "
          )} you need to re-queue manually after this invocation. \n \n The original quque-order was ${queue.data.join(
            " > "
          )}`,
          components: [],
        });
        for (let queuer of queue.data) {
          const test = await helpMeLittleHelper({ id: queuer }, "delete");
        }
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
