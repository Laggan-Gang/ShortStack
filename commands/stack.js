// kolla om det här funkar? "use strict";
//Consistency in playerArray/updatedArray/objectArray

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const { request } = require("undici");
const axios = require("axios");
const { laggStatsBaseUrl } = require("../config.json");

const PREF_URL = laggStatsBaseUrl + "/d2pos";
const basePlayer = { position: "Has not picked yet", randomed: 0 };
const standardTime = 60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stack")
    .setDescription("Dota 2 role selection tool")
    .addUserOption((option) =>
      option.setName("p1").setDescription("Select a player").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("p2").setDescription("Select a player").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("p3").setDescription("Select a player").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("p4").setDescription("Select a player").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("p5").setDescription("Select a player").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("time").setDescription("Pick time")
    ),
  execute: function setup(interaction) {
    const choices = [];
    const numPlayers = 5;
    const pickTime = interaction.options.getInteger("time") || standardTime;
    for (let i = 1; i < numPlayers + 1; i++) {
      const { id } = interaction.options.getUser("p" + i);
      if (choices.includes(id)) {
        interaction.reply(
          "Please provide 5 unique players!\nLove, **ShortStack!**"
        );
        return;
      }
      console.log(id);
      choices.push(id);
    }
    badaBing(interaction, choices, pickTime);
    //const siphon = interactionSiphon(interaction);
    //const choices = [];
    //const numPlayers = 5;
    //for (let i = 1; i < numPlayers + 1; i++) {
    //  const { id } = interaction.options.getUser("p" + i);
    //  if (choices.includes(id)) {
    //    interaction.reply(
    //      "Please provide 5 unique players!\nLove, **ShortStack!**"
    //    );
    //    return;
    //  }
    //  choices.push(id);
    //}´
    //const channel = await interaction.channel;
    //const memberArray = [];
    //for (chosen of siphon.choices) {
    //  memberArray.push(await interaction.guild.members.fetch(chosen));
    //}
    //await interaction.deferReply();
    //const memberArray = [];
    //const numPlayers = 5;
    ////Joel unique id checking code
    //const uniquePlayerIds = [];
    //for (let i = 1; i < numPlayers + 1; i++) {
    //  const { id } = interaction.options.getUser("p" + i);
    //  const currentMember = await interaction.guild.members.fetch(id);
    //  if (uniquePlayerIds.includes(currentMember.id)) {
    //    interaction.reply(
    //      "Please provide 5 unique players!\nLove, **ShortStack!**"
    //    );
    //    return;
    //  }
    //  memberArray.push(currentMember);
    //  uniquePlayerIds.push(currentMember.id);
    //}
    //const pickTime = interaction.options.getInteger("time") || 60;
    //const shuffledArray = shuffle(memberArray);
    //const playerArray = [];
    //for (player of shuffledArray) {
    //  const preferred = await getMyPreferences(player.id);
    //  playerArray.push({
    //    ...basePlayer,
    //    player,
    //    preferred,
    //  });
    //}
    //await interaction.deleteReply();
    //const thread = await channel.threads.create({
    //  name: interaction.user.username + "'s Dota Party",
    //  autoArchiveDuration: 60,
    //  reason: "Time to set up your dota party!",
    //});
    //const message = await thread.send({
    //  content: `${shuffledArray.join("", " ")}`,
    //});
    //await badabingBadaboom(playerArray, message, siphon.pickTime);
  },
};

async function badaBoom(playerArray, message, pickTime, recentlyPicked) {
  const updatedArray = [];

  //DÅLIGA, EGENTLIGA, ELAD, GULLIGA, ROB
  //If someone has recently picked we update the big array to include that pick
  if (recentlyPicked) {
    for (player of playerArray) {
      if (player.player == recentlyPicked.player) {
        if (recentlyPicked.position.startsWith("pos")) {
          const { body } = await request(
            player.player.user.displayAvatarURL({ extension: "jpg" })
          );
          const avatar = await body.arrayBuffer();
          recentlyPicked.avatar = avatar;
        }
        updatedArray.push(recentlyPicked);
      } else {
        updatedArray.push(player);
      }
    }
  } else {
    //for (player of playerArray) {
    //  updatedArray.push(player);
    //}
    updatedArray.push(...playerArray);
  }
  const available = availableRoles(updatedArray);
  const nextUp = whosNext(updatedArray);
  const buttonRows = rowBoat(nextUp, available);
  const embed = await prettyEmbed(updatedArray, nextUp);

  if (!nextUp.object) {
    await message.edit({
      content: "",
      embeds: [embed.embed],
      files: [embed.file],
      components: [],
    });
    return;
  }

  const assignedRole = appropriateRole(available, nextUp);
  const time = getTimestampInSeconds();
  const spaghettiTime = -1; //HURRY UP
  await message.edit({
    content: `${nextUp.object.player.toString()} You're up! If you do not pick you will be assigned ${assignedRole} in <t:${
      time + pickTime + spaghettiTime
    }:R>`,
    embeds: [embed.embed],
    components: buttonRows,
    files: [embed.file],
  });

  //Discord requires a filter for collectors
  //TURNS OUT THE FILTERS ARE ACTUALLY REALLY GOOD! Now we make sure we can only edit 1 embed thingy in case of multiples
  const filter = (i) => i.channel.id === message.channel.id;
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: pickTime * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    console.log(i.user.username);
    //The interaction will be "failed" unless we do something with it
    try {
      await i.reply("Roger, babe!");
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  });

  collector.on("end", async (collected) => {
    try {
      if (collected.last()) {
        if (collected.last().customId == "random") {
          const unpickedRoles = [...available];
          //TODO: Gacha
          //switch (true) {
          //  case tärningen > 95:
          //    unpickedRoles.push("☭");
          //  case tärningen > 85:
          //    unpickedRoles.push("Ⓐ");
          //  case tärningen > 5:
          //    unpickedRoles.push("fill");
          //}
          unpickedRoles.push("fill");
          const recentlyPicked = {
            player: nextUp.object.player,
            position: shuffle(unpickedRoles)[0],
            preferred: nextUp.object.preferred,
            avatar: nextUp.object.avatar,
            randomed: nextUp.object.randomed + 1,
          };
          badaBoom(updatedArray, message, pickTime, recentlyPicked);
        } else {
          const recentlyPicked = {
            player: nextUp.object.player,
            position: collected.last().customId,
            preferred: nextUp.object.preferred,
            avatar: nextUp.object.avatar,
            randomed: nextUp.object.randomed,
          };
          badaBoom(updatedArray, message, pickTime, recentlyPicked);
        }
      } else {
        const recentlyPicked = {
          player: nextUp.object.player,
          position: assignedRole,
          preferred: nextUp.object.preferred,
          avatar: nextUp.object.avatar,
          randomed: nextUp.object.randomed,
        };
        badaBoom(updatedArray, message, pickTime, recentlyPicked);
      }
    } catch (error) {
      message.edit("There was an error baby  " + error);
      console.log(error);
    }
  });
}

async function prettyEmbed(updatedArray, nextUp) {
  //const BLANK = "\u200b";
  const playerFields = arrayPrettifier(updatedArray).join("\n");
  const art = await artTime(updatedArray);
  if (nextUp.object) {
    const embed = {
      color: (Math.random() * 0xffffff) << 0,
      fields: [{ name: "Picking order: ", value: playerFields }],
      image: {
        url: "attachment://dota-map.png",
      },
    };
    const embedObject = { embed: embed, file: art };
    return embedObject;
  } else {
    const finalText = finalMessageMaker(updatedArray);
    const finalMessage = { text: finalText.finalMessage };
    const shortCommand = "`" + finalText.shortCommand + "`";
    const embed = {
      color: (Math.random() * 0xffffff) << 0,
      fields: [
        { name: "Copy Code:", value: shortCommand },
        { name: "Picking complete!", value: playerFields },
      ],
      image: {
        url: "attachment://dota-map.png",
      },
      footer: finalMessage,
    };
    const embedObject = { embed: embed, file: art };
    return embedObject;
  }
}

function whosNext(objectArray) {
  //maybe use array.find
  for (object of objectArray) {
    if (object.position === "Has not picked yet") {
      return { object: object, fillFlag: false };
    }
  }
  //.slic() to make shallow copy otherwise it all goes to hell I guess
  const reversedArray = objectArray.slice().reverse();
  for (object of reversedArray) {
    if (object.position === "fill") {
      return { object: object, fillFlag: true };
    }
  }
  return { object: undefined, fillFlag: false };
}

function arrayPrettifier(playerArray) {
  const optimalStringLength = 39;
  const prettyArray = [];
  for (player of playerArray) {
    if (player.player.nickname) {
      const neededFilling =
        optimalStringLength -
        (player.player.nickname.length + player.position.length);
      prettyArray.push(
        stringPrettifier(
          player.player.nickname,
          neededFilling,
          player.position,
          player.randomed
        )
      );
    } else {
      const neededFilling =
        optimalStringLength -
        (player.player.user.username.length + player.position.length);
      prettyArray.push(
        stringPrettifier(
          player.player.user.username,
          neededFilling,
          player.position,
          player.randomed
        )
      );
    }
  }
  return prettyArray;
}

function stringPrettifier(player, fillingNeeded, position, randomed) {
  const stringFilling = " ".repeat(fillingNeeded + 1 - randomed);
  const interrobangs = "⁉️".repeat(randomed);
  return `\`\`${player}${stringFilling} ${position}${interrobangs}\`\``;
}

//shuffle(array)
//NOTE: This is NOT the Maakep Engine, I forgot where it is and couldn't be bothered to find it.
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

async function artTime(updatedArray) {
  const canvas = Canvas.createCanvas(308, 308);
  const context = canvas.getContext("2d");
  const background = await Canvas.loadImage("./map.png");
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  context.beginPath();
  //pos 1 circle crop
  context.arc(260, 273, 25, 0, Math.PI * 2, true);
  context.closePath();
  //pos 2 circle crop
  context.arc(150, 150, 25, 0, Math.PI * 2, true);
  context.closePath();
  //pos 3 circle crop
  context.arc(35, 50, 25, 0, Math.PI * 2, true);
  context.closePath();
  //pos 4 circle crop
  context.arc(125, 65, 25, 0, Math.PI * 2, true);
  context.closePath();
  //pos 5 circle crop
  context.arc(210, 273, 25, 0, Math.PI * 2, true);
  context.closePath();

  context.clip();
  for (player of updatedArray) {
    if (player.position.startsWith("pos")) {
      const avatar = await Canvas.loadImage(player.avatar);
      const draw = (x, y) => context.drawImage(avatar, x, y, 50, 50);
      switch (player.position) {
        case "pos1":
          draw(235, 248);
          break;
        case "pos2":
          draw(125, 125);
          break;
        case "pos3":
          draw(10, 25);
          break;
        case "pos4":
          draw(100, 40);
          break;
        case "pos5":
          draw(185, 248);
          break;
      }
    }
  }
  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: "dota-map.png",
  });
  return attachment;
}

function rowBoat(nextUp, available) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos1")
        .setLabel("1️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!available.includes("pos1"))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos2")
        .setLabel("2️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!available.includes("pos2"))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos3")
        .setLabel("3️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!available.includes("pos3"))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos4")
        .setLabel("4️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!available.includes("pos4"))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos5")
        .setLabel("5️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!available.includes("pos5"))
    );
  //5 buttons/row is max for Discord, so I'm splitting them in half :)
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("fill")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("935684531023925299")
        .setDisabled(nextUp.fillFlag)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("random")
        .setLabel("⁉️")
        .setStyle(ButtonStyle.Primary)
    );
  return [row1, row2];
}

function finalMessageMaker(playerArray) {
  const finalArray = [];
  const shortArray = ["/stack"];
  let i = 1;
  for (player of playerArray) {
    shortArray.push(`p${i}:${player.player.toString()}`);
    if (player.randomed > 0) {
      let interrobangAmount = "";
      for (let i = 0; i < player.randomed; i++) {
        interrobangAmount += "⁉️";
      }
      finalArray.push(
        `${player.player.user.username} ${player.position.slice(
          3
        )}${interrobangAmount}`
      );
    } else {
      finalArray.push(
        `${player.player.user.username} ${player.position.slice(3)}`
      );
    }
    i++;
  }
  const finalMessage = finalArray.join(" | ");
  const joinedArray = shortArray.join(" ");
  return { finalMessage: finalMessage, shortCommand: joinedArray };
}

function appropriateRole(available, nextUp) {
  //previously "for (preference of nextUp.object.preferred.slice()) {"
  for (preference of nextUp.object.preferred) {
    for (role of available) {
      if (preference == role) {
        return preference;
      }
    }
  }
  if (nextUp.fillFlag) {
    const artificialPreference = shuffle(available)[0];
    return artificialPreference;
  } else {
    return "fill";
  }
}

async function getMyPreferences(discordId) {
  const res = await axios.default.post(PREF_URL, {
    aliases: [discordId],
  });
  const prefs = res.data?.[0]?.preference;
  for (preference of prefs) {
    if (parseInt(preference)) {
      prefs[prefs.indexOf(preference)] = "pos" + preference;
    }
  }
  return prefs;
}

function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function availableRoles(objectArray) {
  const standardRoles = ["pos1", "pos2", "pos3", "pos4", "pos5"];
  for (object of objectArray) {
    if (object.position.startsWith("pos")) {
      standardRoles.splice(standardRoles.indexOf(object.position), 1);
    }
  }
  return standardRoles;
}

//function interactionSiphon(interaction) {
//  const choices = [];
//  const numPlayers = 5;
//  const pickTime = interaction.options.getInteger("time") || standardTime;
//  for (let i = 1; i < numPlayers + 1; i++) {
//    const { id } = interaction.options.getUser("p" + i);
//    if (choices.includes(id)) {
//      interaction.reply(
//        "Please provide 5 unique players!\nLove, **ShortStack!**"
//      );
//      return;
//    }
//    choices.push(id);
//  }
//  return { choices, pickTime };
//}

async function badaBing(interaction, choices, pickTime) {
  interaction.deferReply();
  //const memberArray = [];
  //for (chosen of choices) {
  //  memberArray.push(await interaction.guild.members.fetch(chosen));
  //}
  const memberArray = await Promise.all(
    choices.map(interaction.guild.members.fetch)
  );

  const channel = await interaction.channel;
  const shuffledArray = shuffle(memberArray);
  const playerArray = [];
  for (player of shuffledArray) {
    const preferred = await getMyPreferences(player.id);
    playerArray.push({
      ...basePlayer,
      player,
      preferred,
    });
  }
  await interaction.deleteReply();
  const thread = await channel.threads.create({
    name: interaction.user.username + "'s Dota Party",
    autoArchiveDuration: 60,
    reason: "Time to set up your dota party!",
  });
  const message = await thread.send({
    content: `${shuffledArray.join("", " ")}`,
  });
  badaBoom(playerArray, message, pickTime);
}
