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
  const buttonRow = rowBoat("I'M IN");
  console.log(buttonRow);

  //<@&412260353699872768>
  console.log("Nu är vi precis innan embed");
  const message = await interaction.channel.send({
    content: "Yapos",
    embeds: [embed],
    components: [buttonRow],
  });
  const filter = (i) => i.channel.id === message.channel.id;
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: 5 * 60 * 1000,
    max: 4,
  });
  collector.on("collect", async (i) => {
    console.log(i.user.username);
    if (confirmedPlayers.length < 4) {
      console.log(collector.collected.last);
      console.log(i.user.toString());
      console.log("Nu är confirmed players " + confirmedPlayers.length);
      console.log("Confirmed Players " + confirmedPlayers);
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
      message.edit({ content: "Looks like you ran out of time, darlings!" });
      //do thing with collected info
    } else {
      message.edit({
        content: "Looks like we got a stack!",
        components: [rowBoat("STACK IT, BABE")],
      });
      stackIt(message);
    }
  });
}

function stackIt(message) {
  const filter = (i) => i.channel.id === message.channel.id;
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: 5 * 60 * 1000,
    max: 1,
  });
  collector.on("collect", async (i) => {
    //The interaction will be "failed" unless we do something with it
    try {
      await i.reply("This is not a thing just yet, sorry!!!");
    } catch (error) {
      console.log(error);
    }
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
      playerFields.push(`${BLANK}`);
    }
  }
  const embed = {
    color: (Math.random() * 0xffffff) << 0,
    fields: [{ name: "Who's up for DOTA: ", value: playerFields.join("\n") }],
    //image: {
    //  url: "attachment://dota-map.png",
    //},
  };
  return embed;
}

function rowBoat(btnText) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("in")
      .setLabel(btnText)
      .setStyle(ButtonStyle.Secondary)
  );
  return buttonRow;
}
