//TODO: make the bot print the configuration used, pretty things (Make pretty with spaces!!!)
//Consistency in playerArray/updatedArray/objectArray
//Maakep integration
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
  async execute(interaction) {
    const playerArray = [];
    const numPlayers = 5;
    //Joel unique id checking code
    const uniquePlayerIds = [];
    for (let i = 1; i < numPlayers + 1; i++) {
      const currentPlayer = await interaction.guild.members.fetch(
        interaction.options.getUser("p" + i).id
      );
      if (uniquePlayerIds.includes(currentPlayer.id)) {
        interaction.reply(
          "Please provide 5 unique players!\nLove, **ShortStack**!"
        );
        return;
      }
      playerArray.push(currentPlayer);
      uniquePlayerIds.push(currentPlayer.id);
    }
    let pickTime = await interaction.options.getInteger("time");
    if (!pickTime) {
      pickTime = 60;
    }
    console.log(pickTime);
    await interaction.reply(
      "Roger dodger, baby! Give me a moment to set up...\nLove, **ShortStack**!"
    );
    const shuffledArray = shuffle(playerArray);
    const objectArray = [];
    for (player of shuffledArray) {
      const preferences = await getMyPreferences(player.id);
      const { body } = await request(
        player.user.displayAvatarURL({ extension: "jpg" })
      );
      console.log(body);
      objectArray.push({
        player: player,
        position: "Has not picked yet",
        preferred: preferences,
        avatar: body,
      });
    }
    await interaction.deleteReply();
    const thread = await interaction.channel.threads.create({
      name: interaction.user.username + "'s Dota Party",
      autoArchiveDuration: 60,
      reason: "Time to set up your dota party!",
    });
    const message = await thread.send({
      content: `${shuffledArray.join("", " ")}`,
    });
    await badabingBadaboom(objectArray, message, pickTime);
  },
};

async function badabingBadaboom(
  objectArray,
  interaction,
  pickTime,
  recentlyPicked
) {
  const updatedArray = [];
  //If someone has recently picked we update the big array to include that pick
  if (recentlyPicked) {
    for (object of objectArray) {
      if (object.player == recentlyPicked.player) {
        updatedArray.push(recentlyPicked);
      } else {
        updatedArray.push(object);
      }
    }
  } else {
    for (object of objectArray) {
      updatedArray.push(object);
    }
  }

  const nextUp = whosNext(updatedArray);
  const buttonRows = rowBoat(updatedArray);
  const embed = await prettyEmbed(updatedArray);
  //pre-assign role preferences for players when they're put into the big array, make new property for them and read them that way
  if (nextUp.object) {
    const assignedRole = appropriateRole(updatedArray);
    const time = getTimestampInSeconds();
    const spaghettiTime = 1; //Time isn't what you want it to be
    await interaction.edit({
      content: `${nextUp.object.player.toString()} You're up! If you do not pick you will be assigned ${assignedRole} in <t:${
        time + pickTime + spaghettiTime
      }:R>`,
      embeds: [embed.embed],
      components: buttonRows,
      files: [embed.file],
    });
  } else {
    await interaction.edit({
      content: "",
      embeds: [embed.embed],
      files: [embed.file],
      components: [],
    });
    return;
  }

  //Discord requires a filter for collectors
  //TURNS OUT THE FILTERS ARE ACTUALLY REALLY GOOD! Now we make sure we can only edit 1 embed thingy in case of multiples
  const filter = (i) => i.channel.id === interaction.channel.id;
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: pickTime * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    console.log(i.user.username);
    //The interaction will be "failed" unless we do something with it
    try {
      await i.reply("Roger, baby!");
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  });
  collector.on("end", async (collected) => {
    if (collected.last()) {
      try {
        console.log("avatar ser ut såhär" + nextUp.object.avatar);
        const recentlyPicked = {
          player: nextUp.object.player,
          position: collected.last().customId,
          preferred: nextUp.object.preferred,
          avatar: nextUp.object.avatar,
        };
        await badabingBadaboom(
          updatedArray,
          interaction,
          pickTime,
          recentlyPicked
        );
      } catch (error) {
        interaction.edit("There was an error baby  " + error);
        console.log(error);
      }
    } else {
      console.log("avatar ser ut såhär" + nextUp.object.avatar);
      const assignedRole = appropriateRole(updatedArray);
      const recentlyPicked = {
        player: nextUp.object.player,
        position: assignedRole,
        preferred: nextUp.object.preferred,
        avatar: nextUp.object.avatar,
      };
      await badabingBadaboom(
        updatedArray,
        interaction,
        pickTime,
        recentlyPicked
      );
    }
  });
}

function buttonHasBeenPicked(objectArray, i) {
  for (object of objectArray) {
    if (object.position === `pos${i}`) {
      return true;
    }
  }
  return false;
}

async function prettyEmbed(playerArray) {
  const BLANK = "\u200b";
  const playerFields = arrayPrettifier(playerArray).join("\n");
  const art = await artTime(playerArray);
  if (whosNext(playerArray).object) {
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
    const finalMessage = { text: finalMessageMaker(playerArray) };
    const embed = {
      color: (Math.random() * 0xffffff) << 0,
      fields: [{ name: "Picking complete!", value: playerFields }],
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
  return false;
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
        stringPrettifier(player.player.nickname, neededFilling, player.position)
      );
    } else {
      const neededFilling =
        optimalStringLength -
        (player.player.user.username.length + player.position.length);
      prettyArray.push(
        stringPrettifier(
          player.player.user.username,
          neededFilling,
          player.position
        )
      );
    }
  }
  return prettyArray;
}

function stringPrettifier(player, fillingNeeded, position) {
  let stringFilling = "";
  for (let i = 0; i < fillingNeeded + 1; i++) {
    stringFilling += " ";
  }
  return `\`\`${player}${stringFilling} ${position}\`\``;
}

//NOTE: This is NOT the Maakep Engine, I forgot where it is and couldn't be bothered to find it.
function shuffle(array) {
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

async function artTime(objectArray) {
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
  for (object of objectArray) {
    if (object.position.startsWith("pos")) {
      //object.avatar
      //const { body } = await request(
      //  object.player.user.displayAvatarURL({ extension: "jpg" })
      //);
      console.log("Art time avatar är: " + object.avatar);
      const avatar = await Canvas.loadImage(await object.avatar.arrayBuffer());
      switch (object.position) {
        case "pos1":
          context.drawImage(avatar, 235, 248, 50, 50);
          break;
        case "pos2":
          context.drawImage(avatar, 125, 125, 50, 50);
          break;
        case "pos3":
          context.drawImage(avatar, 10, 25, 50, 50);
          break;
        case "pos4":
          context.drawImage(avatar, 100, 40, 50, 50);
          break;
        case "pos5":
          context.drawImage(avatar, 185, 248, 50, 50);
          break;
      }
    }
  }
  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: "dota-map.png",
  });
  return attachment;
}

function rowBoat(updatedArray) {
  const nextUp = whosNext(updatedArray);
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos1")
        .setLabel("1️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(buttonHasBeenPicked(updatedArray, 1))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos2")
        .setLabel("2️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(buttonHasBeenPicked(updatedArray, 2))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos3")
        .setLabel("3️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(buttonHasBeenPicked(updatedArray, 3))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos4")
        .setLabel("4️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(buttonHasBeenPicked(updatedArray, 4))
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("pos5")
        .setLabel("5️⃣")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(buttonHasBeenPicked(updatedArray, 5))
    );
  //5 buttons/row is max for Discord, so I'm splitting them in half :)
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fill")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("935684531023925299")
      .setDisabled(nextUp.fillFlag)
  );
  return [row1, row2];
}

function finalMessageMaker(playerArray) {
  const finalMessage =
    playerArray[0].player.user.username +
    " " +
    playerArray[0].position.slice(3) +
    " | " +
    playerArray[1].player.user.username +
    " " +
    playerArray[1].position.slice(3) +
    " | " +
    playerArray[2].player.user.username +
    " " +
    playerArray[2].position.slice(3) +
    " | " +
    playerArray[3].player.user.username +
    " " +
    playerArray[3].position.slice(3) +
    " | " +
    playerArray[4].player.user.username +
    " " +
    playerArray[4].position.slice(3);
  return finalMessage;
}

function appropriateRole(objectArray) {
  //this doesn't really need to return an array lol
  const nextUp = whosNext(objectArray);
  console.log(
    "Next up är " +
      nextUp.object.player.user.username +
      " med preferenserna " +
      nextUp.object.preferred
  );
  const standardRoles = ["pos1", "pos2", "pos3", "pos4", "pos5"];
  for (object of objectArray) {
    if (object.position.startsWith("pos")) {
      standardRoles.splice(standardRoles.indexOf(object.position), 1);
    }
  }
  console.log(
    "Nu har jag kollat igenom vilka roller som blivit pickade, och de som inte är pickade är: " +
      standardRoles
  );
  for (preference of nextUp.object.preferred.slice()) {
    for (role of standardRoles) {
      if (preference == role) {
        console.log("This unpicked role is getting sent" + preference);
        return preference;
      }
    }
  }
  if (nextUp.fillFlag) {
    const artificialPreference = shuffle(standardRoles)[0];
    console.log(
      "No matching available roles to preference, sending random role instead " +
        artificialPreference
    );
    return artificialPreference;
  } else {
    console.log(
      "Har kollat igenom hela listan, fill flag är av, tjongar på fill"
    );
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
