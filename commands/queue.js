const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    const queue = postQueue(queuer);
    console.log(queue.data);
    await interaction.reply({
      content: "The queue looks like this: " + queue.data.join("\n"),
      ephemeral: true,
    });
  },
};
const postQueue = async (queuer) => {
  const request = {
    baseURL: "http://localhost:3000/",
    url: "queue",
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    data: queuer,
    responseType: "json",
  };
  try {
    const res = await axios(request);
    return res;
  } catch (error) {
    console.error(error);
  }
};
