const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { helpMeLittleHelper, getTimestamp } = require("../utils");

const READYTIME = 5 * 60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invoke")
    .setDescription("Time to invoke the queue")
    .addIntegerOption((option) =>
      option
        .setName("vacancies")
        .setDescription("How many slots are open?")
        .setRequired(true)
        .addChoices(
          { name: "1 Slot open", value: 1 },
          { name: "2 Slots open", value: 2 },
          { name: "3 Slots open", value: 3 },
          { name: "4 Slots open", value: 4 }
        )
    ),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = await helpMeLittleHelper(queuer, "get");
    if (queue.data.length < 1) {
      interaction.reply(`There's no one in the queue, bozo`);
      return;
    }
    const vacancies = interaction.options.getInteger("vacancies");
    const unreadiedArr = [...queue.data];
    const readiedArr = [];

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rdyQueue")
        .setLabel("✅")
        .setStyle(ButtonStyle.Success)
    );
    const time = getTimestamp(1000) + READYTIME;
    await interaction.reply({
      content: `${queue.data.join(
        ", "
      )} you are being summoned. Your time to show ends <t:${time}:R>`,
      components: [buttonRow],
    });
    const message = await interaction.fetchReply();

    const filter = (i) =>
      i.customId === "rdyQueue" && unreadiedArr.includes(i.user.toString());
    const collector = await message.channel.createMessageComponentCollector({
      filter,
      time: READYTIME * 1000,
      max: queue.data.length,
    });
    collector.on("collect", async (i) => {
      readiedArr.push(i.user.toString());
      removeFromArray(unreadiedArr, i.user.toString());
      //const queuerIndex = unreadiedArr.indexOf(i.user.toString());
      //if (queuerIndex > -1) {
      //  unreadiedArr.splice(queuerIndex, 1);
      //}
      await message.edit(updateMessage(unreadiedArr, readiedArr, time));
      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      try {
        const acceptedApplicants = claimToTheThrone(
          queue.data,
          readiedArr,
          vacancies
        );
        message.edit({
          content: `${acceptedApplicants.join(
            " & "
          )} you're ***CONFIRMED IN***. \n${unreadiedArr.join(
            ", "
          )} you failed to ready up and have been removed from the queue. \n ${readiedArr.join(
            " & "
          )} you readied up on time and will remain in the queue. Better luck next time :)`,
          components: [],
        });
        for (let noShow of unreadiedArr) {
          const test = await helpMeLittleHelper({ id: noShow }, "delete");
        }
      } catch (error) {
        message.edit("There was an error baby  " + error);
        console.log(error);
      }
    });
  },
};

const updateMessage = (unreadiedArr, readiedArr, time) => {
  return `${unreadiedArr.join(
    ", "
  )} you are being summoned. Your time to show ends <t:${time}:R> \n ${readiedArr.join(
    ", "
  )} you have been confirmed ready.`;
};

const removeFromArray = (array, elementToRemove) => {
  const index = array.indexOf(elementToRemove);
  if (index > -1) {
    array.splice(index, 1);
  }
  return;
};

const claimToTheThrone = (originalArray, readiedArr, vacancies) => {
  const heritage = [];
  for (let lineager of originalArray) {
    if (heritage.length < vacancies && readiedArr.includes(lineager)) {
      heritage.push(lineager);
      removeFromArray(readiedArr, lineager);
      console.log(
        `${lineager} was found in the ready array, adding them to heritage. Vacancies is ${vacancies} and heritage length is ${heritage.length}`
      );
    }
  }
  return heritage;
};
