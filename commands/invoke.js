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
      newArray.some((e) => e.id === i.user.toString() && !e.ready);
    const collector = await message.channel.createMessageComponentCollector({
      filter,
      time: READYTIME * 1000,
      max: queue.data.length,
    });
    collector.on("collect", async (i) => {
      newArray.forEach((e) => {
        if (e.id === i.user.toString()) {
          e.ready = true;
        }
      });
      const premature = checkEarlyComplete(newArray, vacancies);
      console.log("Här är premature");
      console.log(premature);

      await message.edit(updateMessage(newArray, time, premature));
      await i.deferReply();
      await i.deleteReply();
    });

    collector.on("end", async (collected) => {
      try {
        const acceptedApplicants = claimToTheThrone(newArray, vacancies);
        const readies = readySort(newArray, true).filter(
          (e) => !acceptedApplicants.includes(e)
        );
        const unreadies = readySort(newArray, false);
        console.log("Accepted Applicants (these are removed from queue)");
        console.log(acceptedApplicants);
        console.log("Readies (these remain in queue)");
        console.log(readies);
        console.log("Unreadies (these are removed from queue)");
        console.log(unreadies);
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
            )} while you did ready up on time, your queue position was not high enough to get into the stack. You remain in the queue, better luck next time :)`
          );
        }
        if (unreadies.length) {
          messageArray.push(
            `${unreadies.join(
              " & "
            )} you failed to ready up and have been removed from the queue due to inactivity.`
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

const updateMessage = (newArray, time, premature) => {
  const message = [];
  const readies = readySort(newArray, true).filter(
    (e) => !premature.includes(e)
  );
  const unreadies = readySort(newArray, false);
  content(premature, message, "premature", time);
  content(readies, message, "readies", time);
  content(unreadies, message, "unreadies", time);
  return message.join("\n \n");
};

const content = (array, message, type, time) => {
  switch (type) {
    case "premature":
      if (array.length) {
        message.push(
          `${array.join(
            " & "
          )} you have been **CONFIRMED IN**, since you were at the top at the queue and the vacant slot/s have been filled.`
        );
      }
      break;
    case "readies":
      if (array.length) {
        message.push(`${array.join(" & ")} you have been confirmed ready.`);
      }
      break;
    case "unreadies":
      if (array.length) {
        message.push(
          `${array.join(
            " & "
          )} you are being summoned. Heed the call <t:${time}:R>, or you will be considered inactive and removed from the /queue`
        );
      }
      break;
  }
};

const claimToTheThrone = (newArray, vacancies) => {
  return readySort(newArray, true).slice(0, vacancies);
};

const readySort = (array, ready) => {
  return array.filter((e) => e.ready === ready).map((e) => e.id);
};

const checkEarlyComplete = (newArray, vacancies) => {
  const prematureFinish = [];
  for (let i = 0; i < vacancies; i++) {
    if (newArray[i].ready) {
      prematureFinish.push(newArray[i].id);
    } else {
      return [];
    }
  }
  return prematureFinish;
};
