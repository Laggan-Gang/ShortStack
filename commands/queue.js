const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Time to queue"),
  async execute(interaction) {
    const queuer = { id: interaction.user.toString() };
    console.log("Här är queuer");
    console.log(queuer);
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
      console.log(res);
      return res;
    } catch (error) {
      console.error(error);
    }

    console.log("Nu är vi i interaction grejen");

    await interaction.reply({
      content: "The queue looks like this: " + request.data.join("\n"),
      ephemeral: true,
    });
  },
};
