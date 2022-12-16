const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const ljudGöraren = require("../jukeBox.js");
const badaBing = require("../badaBing.js");
const standardTime = 60;
const TRASH_CHANNEL = "539847809004994560";
const TRASH_GUILD = "209707792314007552";
const ONEHOUR = 60 * 60;
const FIVEMINUTES = 5 * 60;
const READYTIME = 120;

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
  const condiPlayers = [];
  const embed = prettyEmbed(confirmedPlayers, condiPlayers);
  const inOutButtons = inOut();
  const time = getTimestamp(1000);
  const message = await interaction.channel.send({
    content: `Yapos call, closes <t:${time + ONEHOUR}:R>`, //<@&412260353699872768> yapos
    embeds: [embed],
    components: inOutButtons,
  });
  if (confirmedPlayers.length < 5) {
    const filter = (i) =>
      i.channel.id === message.channel.id &&
      ["in", "out", "condi"].includes(i.customId);
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: ONEHOUR * 1000,
    });
    collector.on("collect", async (i) => {
      console.log(i.user.username + " clicked " + i.customId);
      switch (i.customId) {
        case "in":
          if (!confirmedPlayers.includes(i.user)) {
            eRemover(condiPlayers, i); //remove player from Condi if they're in it
            confirmedPlayers.push(i.user);
            await message.edit({
              embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
            });
            if (confirmedPlayers.length > 4) {
              collector.stop("That's enough!");
            }
            await handleIt(i, "THEY'RE IN!");
          } else {
            await handleIt(i, "YOU'RE ALREADY IN!");
          }
          break;

        case "condi":
          eRemover(confirmedPlayers, i);
          condiPlayers.push(i.user); //remove player from IN if they're in it
          await message.edit({
            embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
          });
          await handleIt(i, "They're IN, but being annoying about it");
          break;

        case "out":
          const pConOut = eRemover(condiPlayers, i);
          const pInOut = eRemover(confirmedPlayers, i);
          if (pInOut || pConOut) {
            await message.edit({
              embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
            });
            await handleIt(i, "THEY'RE OUT");
          } else {
            await handleIt(i, "THEY WERE NEVER IN IN THE FIRST PLACE!!?");
          }
          break;
      }
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
      }
    });
  } else {
    //Time for a ready check
    const party = await pThreadCreator(interaction, message, confirmedPlayers);
    await readyChecker(confirmedPlayers, party.message, party.thread);
  }
}

function eRemover(array, interaction) {
  const index = array.indexOf(interaction.user);
  if (index > -1) {
    array.splice(index, 1); //Return the array instead probably
    return true;
  } else {
    return false;
  }
}

async function readyChecker(confirmedPlayers, partyMessage, partyThread) {
  const readyArray = [];
  const time = getTimestamp(1000);
  const miliTime = getTimestamp(1);
  for (let player of confirmedPlayers) {
    readyArray.push({ gamer: player, ready: false });
  }

  //const readyArray = confirmedPlayers.map((cP) => ({ ...cP, ready: false }));
  //const arrayCopy = [...readyArray];
  const embed = readyEmbed(readyArray);
  await partyMessage.edit({
    content: `Ready check closes <t:${time + READYTIME}:R>`,
    embeds: [embed],
    components: rdyButtons(),
  });

  const filter = (i) =>
    i.channel.id === partyMessage.channel.id &&
    ["rdy", "stop", "sudo", "ping"].includes(i.customId); //I HOPE this logic works
  //might add && confirmedPlayers.includes(i.member)
  const collector = partyMessage.channel.createMessageComponentCollector({
    filter,
    time: READYTIME * 1000,
  });

  collector.on("collect", async (i) => {
    const pickTime = getTimestamp(1);
    console.log(i.user.username + " clicked " + i.customId);
    switch (i.customId) {
      case "rdy":
        const player = readyArray.find((e) => {
          return e.gamer.id === i.member.user.id && e.ready === false;
        });
        if (player) {
          await handleIt(i, "READY");
          player.ready = true;
          player.pickTime = pickTime - miliTime;
          await partyMessage.edit({
            embeds: [readyEmbed(readyArray)],
          });
        }
        if (everyoneReady(readyArray)) {
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
        forceReady(readyArray, pickTime, miliTime);
        await partyMessage.edit({
          embeds: [readyEmbed(readyArray)],
        });
        collector.stop();
        break;
      case "ping":
        await handleIt(i, "Sending a gentle reminder...");
        await pingMessage(readyArray, partyThread);
        break;
    }
    //The interaction will be "failed" unless we do something with it
  });

  collector.on("end", async (collected) => {
    console.log("Now stopping, the final interaction was: ");
    if (collected.last()) {
      console.log(collected.last().customId);
    } else {
      console.log("Nothing!");
    }
    const redoButton = rowBoat("Re-Check", "redo");
    const time = getTimestamp(1000);
    if (!everyoneReady(readyArray)) {
      switch (collected.last()?.customId) {
        case "stop":
          await partyMessage.edit({
            content: `${collected
              .last()
              .member.toString()} stopped the ready check. Option to Re-Check closes <t:${
              time + FIVEMINUTES
            }:R>`,
            components: [redoButton],
          });
          await redoCollector(partyMessage, confirmedPlayers, partyThread);
          return;

        default:
          await partyMessage.edit({
            content: `Ready check failed after ${READYTIME.toString()} seconds. Option to Re-Check closes <t:${
              time + FIVEMINUTES
            }:R>`,
            components: [redoButton],
          });
          await redoCollector(partyMessage, confirmedPlayers, partyThread);
          return;
      }
    } else {
      const stackButton = rowBoat("Stack it!", "stack");
      switch (collected.last().customId) {
        case "sudo":
          await partyMessage.edit({
            content: `${collected
              .last()
              .member.toString()} Used FORCED READY! You should be safe to stack, if not blame ${collected
              .last()
              .member.toString()}`,
            components: [stackButton],
          });
          await stackIt(partyMessage, confirmedPlayers, partyThread);
          return;

        case "rdy":
        case "ping": //in freak cases "ping" can be the last one
          await partyMessage.edit({
            content: "Everyopne's ready!",
            components: [stackButton],
          });
          await stackIt(partyMessage, confirmedPlayers, partyThread);
          return;
      }
    }
  });
}

function forceReady(readyArray, pickTime, miliTime) {
  for (player of readyArray) {
    if (!player.ready) {
      player.ready = true;
      player.pickTime = pickTime - miliTime;
    }
  }
}

function everyoneReady(readyArray) {
  var rCount = 0;
  for (let player of readyArray) {
    if (player.ready) {
      rCount++;
    }
  }
  return rCount > 4;
}

async function pingMessage(readyArray, partyThread) {
  const shitList = [];
  for (let player of readyArray) {
    if (!player.ready) {
      const gentleReminder = await partyThread.send(
        `${player.gamer.toString()}${shuffle(REMINDERS)[0]}`
      );
      shitList.push(gentleReminder);
    }
  }
  for (let message of shitList) {
    await message.delete();
  }
}

async function redoCollector(partyMessage, confirmedPlayers, partyThread) {
  const filter = (i) =>
    i.channel.id === partyMessage.channel.id && i.customId === "redo";
  const collector = partyMessage.channel.createMessageComponentCollector({
    filter,
    time: FIVEMINUTES * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    await handleIt(i, "Again!");
  });

  collector.on("end", async (collected) => {
    switch (collected.last()?.customId) {
      case "redo":
        await readyChecker(confirmedPlayers, partyMessage, partyThread);
        break;
      default:
        await partyMessage.edit({
          content: "Ready check failed.",
          components: [],
        });
        break;
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
  const memberArray = userToMember(confirmedPlayers, interaction);
  ljudGöraren.ljudGöraren(memberArray);
  return { thread: partyThread, message: partyMessage };
}

function userToMember(array, interaction) {
  const memberArray = [];
  for (let user of array) {
    const member = interaction.guild.members.cache.find(
      (member) => member.id === user.id
    );
    memberArray.push(member);
  }
  return memberArray;
}

async function stackIt(message, confirmedPlayers) {
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

  collector.on("end", async (collected) => {
    if (collected.last()) {
      await message.edit({ content: "Stack is running in the Stack Thread!" });
    } else {
      await message.edit({
        content: "You actually don't seem all that ready.",
        components: [],
      });
    }
  });
}

function prettyEmbed(confirmedPlayers, condiPlayers) {
  const maxLength = 5;
  const playerFields = [];
  const conditionalFields = [];
  const embedFields = [];
  for (let i = 0; i < maxLength; i++) {
    if (confirmedPlayers[i]) {
      playerFields.push(confirmedPlayers[i]);
    } else {
      playerFields.push(`${`\`\`Open slot\`\``}`);
    }
  }
  embedFields.push({
    name: "*Who's up for Dota?*",
    value: playerFields.join("\n"),
  });

  if (condiPlayers[0]) {
    condiPlayers.map((e) => {
      conditionalFields.push(e);
    });
    embedFields.push({
      name: "*Conditionally In*",
      value: conditionalFields.join("\n"),
    });
  }

  const embed = {
    color: readyColours[confirmedPlayers.length],
    fields: embedFields,
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
      playerFields.push(
        `${stringPrettifier(player.gamer.toString())} \`\`readied in ${
          player.pickTime / 1000
        }\`\`✅`
      );
    } else {
      playerFields.push(`${stringPrettifier(player.gamer.toString())}❌`);
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
  const stringFilling = "\u200b".repeat(neededFilling + 1);
  return `${string}${stringFilling}`;
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

function inOut() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("in")
        .setLabel("I'M IN")
        .setStyle(ButtonStyle.Success)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("out")
        .setLabel("I'M OUT")
        .setStyle(ButtonStyle.Danger)
    );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("condi")
      .setLabel("I'm In, but...")
      .setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
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

function getTimestamp(mod) {
  return Math.floor(Date.now() / mod);
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
    console.log("Handling it!");
    await i.reply(flavourText);
    await i.deleteReply();
  } catch (error) {
    console.log(error);
  }
}

const REMINDERS = [
  " TAKING OUR SWEET TIME, HUH?",
  " **JALLA, BITCH!**",
  " CHOP CHOP!",
  " NU SKET DU ALLT I DET BLÅ SKÅPET",
  " Hur lång tid kan det ta...",
  " WHAT'S TAKING YOU???",
  " THIS GAME AIN'T GONNA THROW ITSELF",
  " A LITTLE LESS CONVERSATION, A LITTLE MORE ACTION PLEASE",
  " LESS TALK, MORE COCK",
  " LESS STALL, MORE /STACK",
  " POOP FASTER!!!",
  " ***TODAY MB???***",
];

const readyColours = {
  0: 0xff0000,
  1: 0xffa700,
  2: 0xfff400,
  3: 0xa3ff00,
  4: 0x2cba00,
};
