const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const badaBing = require("../badaBing.js");
const standardTime = 60;
const TRASH_CHANNEL = "539847809004994560";
const TRASH_GUILD = "209707792314007552";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yapos")
    .setDescription("Time to gauge dota interest")
    .addUserOption((option) =>
      option.setName("p2").setDescription("Anyone else?").setRequired(false)
    )
    .addUserOption((option) =>
      option.setName("p3").setDescription("Anyone else?").setRequired(false)
    )
    .addUserOption((option) =>
      option.setName("p4").setDescription("Anyone else?").setRequired(false)
    )
    .addUserOption((option) =>
      option.setName("p5").setDescription("Anyone else?").setRequired(false)
    ),

  async execute(interaction) {
    const confirmedPlayers = await arrayMaker(interaction);
    interaction.deferReply();
    interaction.deleteReply();
    await setUp(interaction, confirmedPlayers);
  },
};

async function arrayMaker(interaction) {
  const confirmedPlayers = [interaction.user];
  //It's a 2 because I arbitrarily start at p2 because p2 would be the 2nd person in the Dota party
  for (let i = 2; i < 7; i++) {
    if (interaction.options.getUser("p" + i)) {
      const player = interaction.options.getUser("p" + i);
      if (confirmedPlayers.includes(player)) {
        await interaction.reply(
          "Please provide unique players!\nLove, **ShortStack!**"
        );
        return confirmedPlayers;
      }
      //THIS IS NOT WHERE THINGS GO WRONG
      confirmedPlayers.push(player);
    } else {
      return confirmedPlayers;
    }
  }
}

async function setUp(interaction, confirmedPlayers) {
  //Embed görare
  const embed = prettyEmbed(confirmedPlayers);
  const buttonRow = rowBoat("I'M IN", "in");

  const time = getTimestampInSeconds();
  const anHour = 60 * 60;
  const message = await interaction.channel.send({
    content: `Yapos call, closes <t:${time + anHour}:R>`, //<@&412260353699872768> yapos
    embeds: [embed],
    components: [buttonRow],
  });
  if (confirmedPlayers.length < 5) {
    const filter = (i) =>
      i.channel.id === message.channel.id && i.customId === "in";
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: anHour * 1000,
      max: 4,
    });
    collector.on("collect", async (i) => {
      if (confirmedPlayers.length < 4) {
        confirmedPlayers.push(i.user);
        await message.edit({
          embeds: [prettyEmbed(confirmedPlayers)],
        });
      } else {
        confirmedPlayers.push(i.user);
        await message.edit({
          embeds: [prettyEmbed(confirmedPlayers)],
        });
        collector.stop("That's enough!");
      }

      //The interaction will be "failed" unless we do something with it
      await handleIt(i, "THEY'RE IN");
    });

    collector.on("end", async (collected) => {
      if (confirmedPlayers.length < 5) {
        await message.edit({
          content: "Looks like you ran out of time, darlings!",
          components: [],
        });

        //do thing with collected info
      } else {
        //Time for a ready check
        const party = await pThreadCreator(
          interaction,
          message,
          confirmedPlayers
        );
        await readyChecker(confirmedPlayers, party.message, party.thread);
        //stackIt(message, confirmedPlayers, queueThread);
      }
    });
  } else {
    //Time for a ready check
    const party = await pThreadCreator(interaction, message, confirmedPlayers);
    await readyChecker(confirmedPlayers, party.message, party.thread);
    //stackIt(message, confirmedPlayers, queueThread);
  }
}

function rdyButtons() {
  const buttonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("rdy")
        .setLabel("✅")
        .setStyle(ButtonStyle.Success)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false)
    );
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("sudo")
        .setLabel("FORCE READY")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("ping")
        .setLabel("Ping")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false)
    );
  return [buttonRow, row2];
}
async function readyChecker(confirmedPlayers, partyMessage, partyThread) {
  const readyArray = [];
  for (let player of confirmedPlayers) {
    readyArray.push({ gamer: player, ready: false });
  }

  //const readyArray = confirmedPlayers.map((cP) => ({ ...cP, ready: false }));
  //const arrayCopy = [...readyArray];
  const embed = readyEmbed(readyArray);
  const hasClicked = [];
  await partyMessage.edit({
    content: "",
    embeds: [embed],
    components: rdyButtons(),
  });

  const filter = (i) =>
    i.channel.id === partyMessage.channel.id &&
    i.customId === ("rdy" || "stop" || "sudo") &&
    !hasClicked.includes(i.user.id); //make sure to make this
  //might add && confirmedPlayers.includes(i.member)
  const collector = partyMessage.channel.createMessageComponentCollector({
    filter,
    time: 3 * 60 * 1000,
  });
  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "rdy":
        const player = readyArray.find(
          (e) => e.gamer.id === i.member.user.id && e.ready === false
        );
        if (player) {
          await handleIt(i, "READY");
          //const index = arrayCopy.findIndex((e) => e === player);
          player.ready = true;
          await partyMessage.edit({
            embeds: [readyEmbed(readyArray)],
          });
        }
        var i = 0;
        for (let player of readyArray) {
          if (player.ready) {
            i++;
          }
        }
        if (i > 4) {
          console.log("Now stopping");
          collector.stop("That's enough");
        }
        break;
      case "stop":
        await handleIt(i, "ABORTING!!!");
        collector.stop("Someone wants out!");
        break;
      case "sudo":
        await handleIt(i, "``sudo ready``");
        collector.stop();
        break;
      case "ping":
        await handleIt(i, "Sending a gentle reminder...");
        await pingMessage(readyArray, partyThread);
        break;
    }
    //The interaction will be "failed" unless we do something with it
  });

  async function pingMessage(readyArray, partyThread) {}

  collector.on("end", async (collected) => {
    console.log("Här är senaste collected");
    console.log(collected.last().customId);
    if (collected.last().customId === ("rdy" || "sudo")) {
      const stackButton = rowBoat("Stack it!", "stack");
      await partyMessage.edit({ components: [stackButton] });
      await stackIt(partyMessage, confirmedPlayers, partyThread);
    } else if (collected.last().customId === "stop") {
      await partyMessage.edit({
        content:
          collected.last().member.toString() + " stopped the ready check",
        components: [],
      });
    } else {
      await partyMessage.edit({
        content: "Time ran out!",
        components: [],
      });
    }
  });
}

async function pThreadCreator(interaction, message, confirmedPlayers) {
  const channel = await interaction.member.guild.channels.cache.get(
    TRASH_CHANNEL
  );
  const partyThread = await channel.threads.create({
    name: interaction.user.username + "'s Party Thread",
    autoArchiveDuration: 60,
    reason: "Time for stack!",
  });

  message.edit({
    content:
      "Looks like we got a stack! Ready check is running in the Party Thread!",
    components: [linkButton(message, partyThread, "Party Thread")],
  });
  const partyMessage = await partyThread.send({
    content: confirmedPlayers.join(),
  });

  return { thread: partyThread, message: partyMessage };
}

async function stackIt(message, confirmedPlayers, partyThread) {
  const filter = (i) =>
    i.channel.id === message.channel.id && i.customId === "stack";
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: 5 * 60 * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    const choices = confirmedPlayers.map((cP) => cP.id); //badaBing takes an array of player IDs, not player objects
    const shuffledChoices = shuffle(choices);

    const threadName = i.user.username;
    const channel = await i.member.guild.channels.cache.get(TRASH_CHANNEL);
    const stackThread = await channel.threads.create({
      name: threadName + "'s Dota Party",
      autoArchiveDuration: 60,
      reason: "Time for stack!",
    });

    const buttons = linkButton(message, stackThread, "Stack Thread"); //this one's fucked
    await message.edit({ components: [buttons] });
    await badaBing.badaBing(
      i,
      shuffledChoices,
      standardTime,
      i.user.username,
      stackThread
    );
  });

  collector.on("end", async (collected) => {});
}

function prettyEmbed(confirmedPlayers) {
  const maxLength = 5;
  const playerFields = [];
  for (let i = 0; i < maxLength; i++) {
    if (confirmedPlayers[i]) {
      playerFields.push(confirmedPlayers[i]);
    } else {
      playerFields.push(`${`\`\`Open slot\`\``}`);
    }
  }
  const embed = {
    color: (Math.random() * 0xffffff) << 0,
    fields: [{ name: "*Who's up for Dota?*", value: playerFields.join("\n") }],
    //image: {
    //  url: "attachment://dota-map.png",
    //},
  };
  return embed;
}

function readyEmbed(readyArray) {
  const playerFields = [];
  for (let player of readyArray) {
    if (player.ready) {
      playerFields.push(player.gamer.toString() + "✅");
    } else {
      playerFields.push(player.gamer.toString() + "❌");
    }
  }
  const embed = {
    color: (Math.random() * 0xffffff) << 0,
    fields: [
      { name: "**R E A D Y  C H E C K**", value: playerFields.join("\n") },
    ],
    //image: {
    //  url: "attachment://dota-map.png",
    //},
  };
  return embed;
}

function stringPrettifier(string) {
  const optimalStringLength = 39;
  const neededFilling = optimalStringLength - string.length;
  const stringFilling = " ".repeat(neededFilling + 1);
  return `\`\`${string}${stringFilling}\`\``;
}

function rowBoat(btnText, btnId) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(btnId)
      .setLabel(btnText)
      .setStyle(ButtonStyle.Secondary)
  );
  return buttonRow;
}

function linkButton(message, thread, label) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setURL(`https://discord.com/channels/${message.guildId}/${thread.id}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Link)
  );
  return buttonRow;
}

function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function shuffle([...array]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function handleIt(i, flavourText) {
  try {
    await i.reply(flavourText);
    await i.deleteReply();
  } catch (error) {
    console.log(error);
  }
}
