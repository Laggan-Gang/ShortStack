//möjligtvis bra inv-länk https://discord.com/api/oauth2/authorize?client_id=1011640018479091722&permissions=328568269888&scope=bot%20applications.commands

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const YAPOSCHANNEL = "1057444797301923860";
const TRASHCHANNEL = "539847809004994560";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
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
  console.log(interaction.commandName);
  if (interaction.commandName === 'yapos') {
    //await interaction.deferReply();
  }
  //console.log(interaction);
  const command = client.commands.get(interaction.commandName);
  if (!interaction.isChatInputCommand()) return;
  if (!command) return;

  try {
    command.execute(interaction);
  } catch (error) {
    console.log("Oopsie! Error in interactionCreate");
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
      components: [],
    });
  }
});

client.login(token);
//For whenever I manage to make a config file and stuff
function rightPlaceChecker(interaction) {
  if ([YAPOSCHANNEL, TRASHCHANNEL].includes(interaction.channelId)) {
    return true;
  }
  interaction.reply(
    `Please handle these kinds of things in ${interaction.guild.channels.cache.get(
      YAPOSCHANNEL
    )} or ${interaction.guild.channels.cache.get(
      TRASHCHANNEL
    )}!\nLove, ShortStack!`
  );
  return false;
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
