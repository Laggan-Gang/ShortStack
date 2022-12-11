//möjligtvis bra inv-länk https://discord.com/api/oauth2/authorize?client_id=1011640018479091722&permissions=328568269888&scope=bot%20applications.commands

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}
client.once("ready", () => {
  console.log("ShortStack!");
});

client.on("interactionCreate", async (interaction) => {
  const command = client.commands.get(interaction.commandName);
  console.log(command.data.name);
  if (!interaction.isChatInputCommand()) return;
  if (command) {
    if (!command.data.name == "yapos") {
      if (!rightPlaceChecker(interaction)) return;
    }
    try {
      command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
        components: [],
      });
    }
  }
});

client.login(token);

//For whenever I manage to make a config file and stuff
function rightPlaceChecker(interaction) {
  if (interaction.channelId != "539847809004994560") {
    interaction.reply(
      `Please handle these kinds of things in ${interaction.guild.channels.cache
        .get("539847809004994560")
        .toString()}!\nLove, ShortStack!`
    );
    return false;
  } else {
    return true;
  }
}

function interactionSiphon(interaction) {
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
    choices.push(id);
  }
  return { choices, pickTime };
}
