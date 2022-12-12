const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const badaBing = require("./stack.js");
const standardTime = 60;

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
    ),

  async execute(interaction) {
    console.log("Nu är vi i interaction grejen");
    const confirmedPlayers = [interaction.user];
    //It's a 2 because I arbitrarily start at p2 because p2 would be the 2nd person in the Dota party
    for (let i = 2; i < 5; i++) {
      if (interaction.options.getUser("p" + i)) {
        const player = interaction.options.getUser("p" + i);
        console.log("Confirmed players ser ut såhär: " + confirmedPlayers);
        console.log("Player ser ut såhär: " + player);
        if (confirmedPlayers.includes(player)) {
          console.log("De är samma!");
          await interaction.reply(
            "Please provide unique players!\nLove, **ShortStack!**"
          );
          return;
        }
        confirmedPlayers.push(player);
        console.log(
          "Confirmed players ser ut såhär efter: " + confirmedPlayers
        );
      } else {
        break;
      }
    }
    interaction.deferReply();
    interaction.deleteReply();
    await setUp(interaction, confirmedPlayers);
  },
};

async function setUp(interaction, confirmedPlayers) {
  //Embed görare
  const embed = prettyEmbed(confirmedPlayers);
  const buttonRow = rowBoat("I'M IN", "in");

  //<@&412260353699872768>
  console.log("Nu är vi precis innan embed");
  const time = getTimestampInSeconds();
  const anHour = 60 * 60;
  const message = await interaction.channel.send({
    content: `Yapos call, closes <t:${time + anHour}:R>`, //<@&412260353699872768>
    embeds: [embed],
    components: [buttonRow],
  });

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
    try {
      await i.reply("THEY'RE IN");
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  });

  collector.on("end", async (collected) => {
    if (confirmedPlayers.length < 4) {
      await message.edit({
        content: "Looks like you ran out of time, darlings!",
        components: [],
      });

      //do thing with collected info
    } else {
      message.edit({
        content: "Looks like we got a stack!",
        components: [rowBoat("STACK IT, BABE", "in")],
      });
      stackIt(message, confirmedPlayers);
    }
  });
}

function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function stackIt(message, confirmedPlayers) {
  const filter = (i) => i.channel.id === message.channel.id;
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: 5 * 60 * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    await message.edit({ components: [] });
    const choices = yapToStack(confirmedPlayers);
    const shuffledChoices = shuffle(choices);
    //try {
    //  await i.reply("Let's rock");
    //} catch (error) {
    //  console.log(error);
    //}
    const threadName = interaction.user.username;
    const channel = interaction.channels.cache.get("539847809004994560");
    const thread = await channel.threads.create({
      name: threadName + "'s Dota Party",
      autoArchiveDuration: 60,
      reason: "Time for stack!",
    });
    await badaBing.badaBing(
      i,
      shuffledChoices,
      standardTime,
      i.user.username,
      thread
    );
  });

  collector.on("end", async (collected) => {});
}

function prettyEmbed(confirmedPlayers) {
  const BLANK = "\u200b";
  const dotaPartySize = 5;
  const playerFields = [];
  for (let i = 0; i < dotaPartySize; i++) {
    //do things with the dota party
    if (confirmedPlayers[i]) {
      playerFields.push(`${confirmedPlayers[i].toString()}`);
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

function rowBoat(btnText, btnId) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(btnId)
      .setLabel(btnText)
      .setStyle(ButtonStyle.Secondary)
  );
  return buttonRow;
}

function yapToStack(array) {
  return array.map((p) => p.id);
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
