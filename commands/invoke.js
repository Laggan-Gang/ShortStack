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
    const newArray = [];
    for (let id of queue.data) {
      newArray.push({ id: id, ready: false });
    }
    //const unreadiedArr = [...queue.data];
    //const readiedArr = [];

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
      i.customId === "rdyQueue" &&
      newArray.filter((e) => e.id === i.user.toString());
    const collector = await message.channel.createMessageComponentCollector({
      filter,
      time: READYTIME * 1000,
      max: queue.data.length,
    });
    collector.on("collect", async (i) => {
      newArray.map((e) => {
        if (e.id === i.user.toString()) {
          e.ready = true;
        }
      });

      //readiedArr.push(i.user.toString());
      //removeFromArray(unreadiedArr, i.user.toString());
      //checkEarlyComplete(queue.data, readiedArr, vacancies);
      await message.edit(updateMessage(newArray, time));
      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      try {
        const acceptedApplicants = claimToTheThrone(newArray, vacancies);
        const readies = newArray.map(idGrabber(e, true));
        const unreadies = newArray.map(idGrabber(e, false));

        const messageArray = [];
        if (!acceptedApplicants.length) {
          messageArray.push("But no one came....");
        } else {
          messageArray.push(
            `${acceptedApplicants.join(" & ")} you're **CONFIRMED IN**.`
          );
        }
        if (readies.length) {
          messageArray.push(
            `${readies.join(
              " & "
            )} you readied up on time and will remain in the queue. Better luck next time :)`
          );
        }
        if (unreadies.length) {
          messageArray.push(
            `${unreadies.join(
              " & "
            )} you failed to ready up and have been removed from the queue.`
          );
        }

        message.edit({
          content: `${messageArray.join("\n \n")}`,
          components: [],
        });

        for (picked of acceptedApplicants) {
          await helpMeLittleHelper({ id: picked }, "delete");
        }

        for (let noShow of unreadies) {
          await helpMeLittleHelper({ id: noShow }, "delete");
        }
      } catch (error) {
        message.edit("There was an error baby  " + error);
        console.log(error);
      }
    });
  },
};

const updateMessage = (newArray, time) => {
  const readies = newArray.map(idGrabber(e, true));
  const unreadies = newArray.map(idGrabber(e, false));

  return `${unreadies.join(
    ", "
  )} you are being summoned. Your time to show ends <t:${time}:R> \n \n ${readies.join(
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

const claimToTheThrone = (newArray, vacancies) => {
  const readies = newArray.map(idGrabber);
  readies.length = vacancies;
  console.log(readies);
  return readies;

  //for (let lineager of originalArray) {
  //  if (heritage.length < vacancies && readiedArr.includes(lineager)) {
  //    heritage.push(lineager);
  //    removeFromArray(readiedArr, lineager);
  //    console.log(
  //      `${lineager} was found in the ready array, adding them to heritage. Vacancies is ${vacancies} and heritage length is ${heritage.length}`
  //    );
  //  }
  //}
  //return heritage;
};

const idGrabber = (e, bool) => {
  if (e.ready === bool) {
    return e.id;
  }
};
const checkEarlyComplete = (originalArray, readiedArr, vacancies) => {
  const originalCopy = [...originalArray];
  const readiedCopy = [...readiedArr];
  const earlyCompleteArr = [];
  for (let i = 0; i < vacancies; i++) {
    if (originalCopy[i] === readiedCopy[i]) {
      earlyCompleteArr.push(originalCopy[i]);
      console.log(
        `${originalCopy[i]} är en match med ${readiedArr[i]} och index är ${i} och vacancies är ${vacancies}`
      );
    }
  }
  if (earlyCompleteArr.length == vacancies) {
    return earlyCompleteArr;
  }

  //code to check if early complete here
};
