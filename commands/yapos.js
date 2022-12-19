const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const badaBing = require("../badaBing.js");
const utils = require("../utils");
const {
  stringPrettifier,
  rowBoat,
  linkButton,
  inOutBut,
  rdyButtons,
  eRemover,
  userToMember,
  getTimestamp,
  shuffle,
  handleIt,
  forceReady,
  everyoneReady,
  pingMessage,
  playerIdentity,
} = require("../utils");
const ljudGöraren = require("../jukeBox.js");

const standardTime = 60;
const TRASH_CHANNEL = "539847809004994560";
const TRASH_GUILD = "209707792314007552";
const ONEHOUR = 60 * 60;
const FIVEMINUTES = 5 * 60;
const READYTIME = 2 * 60;
const buttonOptions = { in: "in", out: "out", condi: "condi" };

const debug = ["<@&412260353699872768>", "yapos"];
const yapos = debug[0];

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
  0: 0x000000, //black
  1: 0xcc3300, //red
  2: 0xff9900,
  3: 0xffff00, //yellow
  4: 0xccff33,
  5: 0x99ff33, //green
};

function arrayMaker(interaction) {
  const confirmedPlayers = [interaction.user];
  //It's a 2 because I arbitrarily start at p2 because p2 would be the 2nd person in the Dota party
  for (let i = 2; i < 7; i++) {
    if (interaction.options.getUser("p" + i)) {
      const player = interaction.options.getUser("p" + i);
      if (confirmedPlayers.includes(player)) {
        interaction.reply(
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
  const inOutButtons = inOutBut();
  const time = getTimestamp(1000);
  const dotaMessage = await interaction.channel.send({
    content: `${yapos} call, closes <t:${time + ONEHOUR}:R>`,
    embeds: [embed],
    components: inOutButtons,
  });
  if (confirmedPlayers.length > 5) {
    const party = await pThreadCreator(
      interaction,
      dotaMessage,
      confirmedPlayers
    );
    await readyChecker(confirmedPlayers, party.message, party.thread);
    return;
  }

  const filter = (i) =>
    i.customId in buttonOptions && i.message.id === dotaMessage.id;
  const collector = dotaMessage.channel.createMessageComponentCollector({
    filter,
    time: ONEHOUR * 1000,
  });
  collector.on("collect", async (i) => {
    console.log(`${i.user.username} clicked ${i.customId}`);
    switch (i.customId) {
      case buttonOptions.in:
        if (!confirmedPlayers.find(playerIdentity(i))) {
          eRemover(condiPlayers, i); //remove player from Condi if they're in it
          confirmedPlayers.push(i.user);
          //await message.edit({
          //  embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
          //});
          if (confirmedPlayers.length > 4) {
            collector.stop("That's enough!");
          }
          await handleIt(i, "THEY'RE IN!");
        } else {
          await handleIt(i, "YOU'RE ALREADY IN!");
        }
        break;

      case buttonOptions.condi:
        if (!condiPlayers.find(playerIdentity(i))) {
          eRemover(confirmedPlayers, i); //remove player from IN if they're in it
          const condition = await modalThing(i);
          console.log(condition);
          condiPlayers.push({ player: i.user, condition: condition });
          //await message.edit({
          //  embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
          //});
        } else {
          await handleIt(
            i,
            "You're already conditionally in, what the hell don't push it wtf"
          );
        }
        break;

      case buttonOptions.out:
        const pConOut = eRemover(condiPlayers, i);
        const pInOut = eRemover(confirmedPlayers, i);
        if (pInOut || pConOut) {
          //await message.edit({
          //  embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
          //});
          await handleIt(i, "THEY'RE OUT");
        } else {
          await handleIt(i, "THEY WERE NEVER IN IN THE FIRST PLACE!!?");
        }
        break;
    }
    await dotaMessage.edit({
      embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
    });
  });

  collector.on("end", async (collected) => {
    if (confirmedPlayers.length < 5) {
      await dotaMessage.edit({
        content: "Looks like you ran out of time, darlings!",
        components: [],
      });

      //do thing with collected info
    } else {
      //Time for a ready check
      const party = await pThreadCreator(
        interaction,
        dotaMessage,
        confirmedPlayers
      );
      await readyChecker(confirmedPlayers, party.message, party.thread);
    }
  });
  //else {
  // //Time for a ready check
  // const party = await pThreadCreator(
  //   interaction,
  //   dotaMessage,
  //   confirmedPlayers
  // );
  // await readyChecker(confirmedPlayers, party.message, party.thread);
  //}
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
    console.log(
      `Now stopping, the final interaction was: ${
        collected.last() ? collected.last().customId : `Nothing!`
      }`
    );
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

async function stackIt(message, confirmedPlayers) {
  const filter = (i) => i.message.id === message.id && i.customId === "stack";
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: FIVEMINUTES * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {});

  collector.on("end", async (collected) => {
    await message.edit({ components: [] });
    if (collected.last()) {
      const interaction = collected.last();
      const choices = confirmedPlayers.map((cP) => cP.id); //badaBing takes an array of player IDs, not player objects
      const shuffledChoices = shuffle(choices);

      const threadName = interaction.user.username;
      const channel = await interaction.member.guild.channels.cache.get(
        TRASH_CHANNEL
      );
      const stackThread = await channel.threads.create({
        name: threadName + "'s Dota Party",
        autoArchiveDuration: 60,
        reason: "Time for stack!",
      });
      await badaBing.badaBing(
        interaction,
        shuffledChoices,
        standardTime,
        threadName,
        stackThread
      );
      const button = linkButton(message, stackThread, "Stack Thread");
      await message.edit({
        content: "Stack is running in the Stack Thread!",
        components: [button],
      });
    } else {
      await message.edit({
        content: "You actually don't seem all that ready.",
      });
    }
  });
}

async function modalThing(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("textCollector")
    .setTitle("Ok, buddy");
  const reasionInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("What's the holdup? Include ETA")
    .setPlaceholder("Describe what's stopping you from being IN RIGHT NOW")
    .setMaxLength(280)
    .setStyle(TextInputStyle.Short);

  const modalInput = new ActionRowBuilder().addComponents(reasionInput);
  modal.addComponents(modalInput);
  await interaction.showModal(modal);
  // Get the Modal Submit Interaction that is emitted once the User submits the Modal
  const submitted = await interaction
    .awaitModalSubmit({
      // Timeout after READYTIME of not receiving any valid Modals
      time: READYTIME * 1000,
      // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
      filter: (i) => i.user.id === interaction.user.id,
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
  const time = getTimestamp(1000);
  const reason = `${submitted.fields.getTextInputValue(
    "reason"
  )} *(written <t:${time}:R>)*`;
  if (reason) {
    await submitted.reply(`Oh "${reason}" huh, I see`);
    await submitted.deleteReply();
    return reason;
  } else {
    await submitted.reply(`Type faster!`);
    await submitted.deleteReply();
  }
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

  if (condiPlayers.length > 0) {
    condiPlayers.map((e) => {
      conditionalFields.push(`${e.player} ${e.condition}`);
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
  let rAmount = 0;
  for (let player of readyArray) {
    if (player.ready) {
      rAmount++;
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
    color: readyColours[rAmount],
    fields: [
      { name: "**R E A D Y  C H E C K**", value: playerFields.join("\n") },
    ],
    //image: {
    //  url: "attachment://dota-map.png",
    //},
  };
  return embed;
}

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
    const confirmedPlayers = arrayMaker(interaction);
    interaction.deferReply();
    interaction.deleteReply();
    await setUp(interaction, confirmedPlayers);
  },
};
