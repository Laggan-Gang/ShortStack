const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

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

function playerIdentity(interaction) {
  return (e) => [e?.id, e.player?.id].includes(interaction.user.id);
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

module.exports = {
  stringPrettifier(string) {
    const optimalStringLength = 39;
    const neededFilling = optimalStringLength - string.length;
    const stringFilling = "\u200b".repeat(neededFilling + 1);
    return `${string}${stringFilling}`;
  },

  rowBoat(btnText, btnId) {
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(btnId)
        .setLabel(btnText)
        .setStyle(ButtonStyle.Secondary)
    );
    return buttonRow;
  },

  linkButton(thread, label) {
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(`https://discord.com/channels/${thread.guild.id}/${thread.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
    );
    return buttonRow;
  },

  inOutBut() {
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
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("dummy")
          .setLabel("Dummy")
          .setStyle(ButtonStyle.Primary)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("condi")
          .setLabel("I'm In, but (...)")
          .setStyle(ButtonStyle.Secondary)
      );
    return [row1, row2];
  },

  rdyButtons() {
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
      );
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("sudo")
          .setLabel("FORCE READY")
          .setStyle(ButtonStyle.Primary)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("ping")
          .setLabel("Ping")
          .setStyle(ButtonStyle.Secondary)
      );
    return [buttonRow, row2];
  },

  eRemover(array, interaction) {
    //const index2 = array.findIndex(interaction.user);
    const index = array.findIndex(playerIdentity(interaction));
    if (index > -1) {
      array.splice(index, 1); //Return the array instead probably
      return true;
    } else {
      return false;
    }
  },

  userToMember(array, interaction) {
    const memberArray = [];
    for (let user of array) {
      const member = interaction.guild.members.cache.find(
        (member) => member.id === user.player.id
      );
      memberArray.push(member);
    }
    return memberArray;
  },

  getTimestamp(mod) {
    return Math.floor(Date.now() / mod);
  },

  modalComponent(reasonInput) {
    return new ActionRowBuilder().addComponents(reasonInput);
  },

  async handleIt(i, flavourText) {
    try {
      console.log("Handling it!");
      await i.reply(flavourText);
      await i.deleteReply();
    } catch (error) {
      console.log(error);
    }
  },

  forceReady(readyArray, pickTime, miliTime) {
    for (player of readyArray) {
      if (!player.ready) {
        player.ready = true;
        player.pickTime = pickTime - miliTime;
      }
    }
  },

  everyoneReady(readyArray) {
    return readyArray.filter((p) => p.ready).length > 4;
  },

  async pingMessage(readyArray, partyThread) {
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
  },

  playerIdentity,
  shuffle,
};
