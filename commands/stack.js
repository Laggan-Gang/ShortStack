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
    const standardRoles = ["pos1", "pos2", "pos3", "pos4", "pos5"];
    //Joel unique id checking code
    const uniquePlayerIds = [];
    for (let i = 1; i < numPlayers + 1; i++) {
      const currentPlayer = await interaction.guild.members.fetch(
        interaction.options.getUser("p" + i).id
      );
      if (uniquePlayerIds.includes(currentPlayer.id)) {
        interaction.reply(
          "Please provide 5 unique players!\nLove, ShortStack!"
        );
        return;
      }
      playerArray.push(currentPlayer);
      uniquePlayerIds.push(currentPlayer.id);
    }
    let pickTime = (await interaction.options.getInteger("time")) * 1000;
    if (!pickTime) {
      pickTime = 60_000;
    }
    console.log(pickTime);
    await interaction.reply("BABY!");
    await interaction.deleteReply();
    const shuffledArray = shuffle(playerArray);
    const objectArray = [];
    for (player of shuffledArray) {
      //tjonga in maakep code here
      objectArray.push({
        player: player,
        position: "Has not picked yet",
        preferred: shuffle(standardRoles),
      });
    }
    console.log(objectArray);
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
  const randomRole = shuffle(availableRoles(updatedArray, nextUp))[0];
  if (nextUp) {
    await interaction.edit({
      content: `${nextUp.player.toString()} You're up! If you do not pick you will be assigned ${randomRole}`,
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
  //TURNS OUT THE FILTERS ARE ACTUALLY REALLY GOOD! Now we make sure we can only edit 1 embed thingy
  const filter = (i) => i.channel.id === interaction.channel.id;
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: pickTime,
    max: 1,
  });
  collector.on("collect", async (i) => {
    console.log(i.user.username);
    //The interaction will be "failed" unless we do something with it
    try {
      await i.reply("lol ok");
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  });
  collector.on("end", async (collected) => {
    if (collected.last()) {
      try {
        const recentlyPicked = {
          player: nextUp.player,
          position: collected.last().customId,
        };
        await badabingBadaboom(
          updatedArray,
          interaction,
          pickTime,
          recentlyPicked
        );
      } catch (error) {
        interaction.edit("There was an error baby  " + error);
      }
    } else {
      const recentlyPicked = { player: nextUp.player, position: randomRole };
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
  const playerFields = [
    {
      name: "Picking order: ",
      value: arrayPrettifier(playerArray).join("\n"),
    },
  ];
  const art = await artTime(playerArray);
  if (whosNext(playerArray)) {
    const embed = {
      color: (Math.random() * 0xffffff) << 0,
      fields: playerFields,
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
      fields: playerFields,
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
      return object;
    }
  }
  //.slic() to make shallow copy otherwise it all goes to hell I guess
  const reversedArray = objectArray.slice().reverse();
  for (object of reversedArray) {
    if (object.position === "fill") {
      return object;
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
      const { body } = await request(
        object.player.user.displayAvatarURL({ extension: "jpg" })
      );
      const avatar = await Canvas.loadImage(await body.arrayBuffer());
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
      .setDisabled(false)
  );
  //NEED FILL-CHECKER
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

function availableRoles(objectArray, nextUp) {
  for (object of objectArray) {
    if (object.position.startsWith("pos")) {
      const availableRole = nextUp.preferred.splice(
        nextUp.preferred.indexOf(object.position),
        1
      );
      console.log(availableRole);
    }
  }
  return availableRole;
}
