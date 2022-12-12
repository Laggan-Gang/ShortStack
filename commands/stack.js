// kolla om det här funkar? "use strict";
//Consistency in playerArray/updatedArray/objectArray

const { SlashCommandBuilder } = require("discord.js");
const badaBing = require("../badaBing.js");
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
  execute: function setup(interaction, yaposBoys) {
    if (!yaposBoys) {
      const choices = [];
      const numPlayers = 5;
      const pickTime = interaction.options.getInteger("time") || standardTime;
      const threadName = interaction.user.username;

      for (let i = 1; i < numPlayers + 1; i++) {
        const { id } = interaction.options.getUser("p" + i);
        if (choices.includes(id)) {
          interaction.reply(
            "Please provide 5 unique players!\nLove, **ShortStack!**"
          );
          return;
        }
        choices.push(id);
      }
      const shuffledChoices = shuffle(choices);
      badaBing.badaBing(interaction, shuffledChoices, pickTime, threadName);
    }
  },
};

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
