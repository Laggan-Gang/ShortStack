const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yapos")
    .setDescription("Time to gauge dota interest"),
  async execute(interaction) {
    console.log("Nu är vi i interaction grejen");
    interaction.reply("Hej hej");
    await setUp(interaction);
  },
};
//probably shouldn't be a loop
async function setUp(interaction, dotaMessage) {
  console.log("Nu är vi i setup");
  const confirmedPlayers = [interaction.member.toString()];
  console.log("confirmedPlayer ser ut såhär: " + confirmedPlayers);
  //Embed görare
  const embed = prettyEmbed(confirmedPlayers);

  //<@&412260353699872768>
  console.log("Nu är vi precis innan embed");
  const message = await interaction.channel.send({
    content: "Yapos",
    embeds: [embed],
    components: [rowBoat()],
  });
  const filter = (i) => i.channel.id === message.channel.id;
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: 5 * 60 * 1000,
    max: 4,
  });
  collector.on("collect", async (i) => {
    console.log(i.user.username);
    if (confirmedPlayers.length() < 5) {
      confirmedPlayers.append(collector.collected.last);
    }

    //The interaction will be "failed" unless we do something with it
    try {
      await i.reply("Roger, babe!");
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  });

  collector.on("end", async (collected) => {
    if (collected.last) {
      //do thing with collected info
    } else {
      //nothing was collected, time to end it all
    }
  });
}

async function prettyEmbed(confirmedPlayers) {
  console.log("Nu är vi i prettyEmbed");
  const BLANK = "\u200b";
  const dotaPartySize = 5;
  const playerFields = [];
  for (let i = 0; i < dotaPartySize; i++) {
    //do things with the dota party
    if (confirmedPlayers[i]) {
      playerFields.push(`${confirmedPlayers[i]}\n`);
    } else {
      playerFields.push(`${BLANK}\n`);
    }
  }
  const embed = {
    color: (Math.random() * 0xffffff) << 0,
    fields: [{ name: "Who's up for DOTA: ", value: playerFields }],
    //image: {
    //  url: "attachment://dota-map.png",
    //},
  };
  const embedObject = {
    embed: embed,
    //file: art
  };
  return embed;
}

function rowBoat() {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("in")
      .setLabel("I'M IN")
      .setStyle(ButtonStyle.Secondary)
  );
  return buttonRow;
}
