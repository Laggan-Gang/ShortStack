const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const badaBing = require('../badaBing.js');
const {
  stringPrettifier,
  rowBoat,
  linkButton,
  inOutBut,
  rdyButtons,
  eRemover,
  userToMember,
  getTimestamp,
  shuffle,
  handleIt,
  helpMeLittleHelper,
  forceReady,
  everyoneReady,
  pingMessage,
  playerIdentity,
  modalComponent,
} = require('../utils');
const ljudGöraren = require('../jukeBox.js');

const standardTime = 60;
const TRASH_CHANNEL = '539847809004994560'; //shit thread
//const TRASH_CHANNEL = "1057444797301923860"; yapos thread
const ONEHOUR = 60 * 60;
const FIVEMINUTES = 5 * 60;
const READYTIME = 2 * 60;
const buttonOptions = { in: 'in', out: 'out', dummy: 'dummy', condi: 'condi' };
const readyOptions = { rdy: 'rdy', stop: 'stop', sudo: 'sudo', ping: 'ping' };

const debug = ['<@&412260353699872768>', 'test yapos'];
const yapos = debug[0];

const readyColours = {
  0: 0x000000, //black
  1: 0xcc3300, //red
  2: 0xff9900,
  3: 0xffff00, //yellow
  4: 0xccff33,
  5: 0x99ff33, //green
};

const invokeQueue = async interaction => {
  const queuer = { id: interaction.user.toString() };
  const queue = await helpMeLittleHelper(queuer, 'get');
  queue.data.forEach(async invokee => {
    await helpMeLittleHelper({ id: invokee }, 'delete');
  });
  return queue.data;
};

function arrayMaker(interaction) {
  const confirmedPlayers = [];
  confirmedPlayers.push({ player: interaction.user });
  //It's a 2 because I arbitrarily start at p2 because p2 would be the 2nd person in the Dota party
  for (let i = 2; i < 7; i++) {
    if (interaction.options.getUser('p' + i)) {
      const player = interaction.options.getUser('p' + i);
      if (confirmedPlayers.includes(player)) {
        return;
      }
      confirmedPlayers.push({ player: player });
    }
  }
  return confirmedPlayers;
}

async function setUp(interaction, confirmedPlayers) {
  //Embed görare
  const condiPlayers = [];
  const time = getTimestamp(1000);
  let initMessage = `${yapos} call, closes <t:${time + ONEHOUR}:R>`;
  const queue = await invokeQueue(interaction);
  if (queue) {
    initMessage += `\nFor your interest ${queue.join(' & ')}`;
  }
  const dotaMessage = await interaction.channel.send({
    content: initMessage,
    embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
    components: inOutBut(),
  });
  const partyThread = await pThreadCreator(interaction, dotaMessage);
  confirmedPlayers.forEach(p => partyThread.members.add(p.player));

  if (confirmedPlayers.length > 4) {
    ljudGöraren.ljudGöraren(userToMember(confirmedPlayers, interaction));
    readyChecker(confirmedPlayers, dotaMessage, partyThread);
    return;
  }

  const filter = i =>
    i.customId in buttonOptions && i.message.id === dotaMessage.id;
  const collector = dotaMessage.channel.createMessageComponentCollector({
    filter,
    time: ONEHOUR * 1000,
  });
  collector.on('collect', async i => {
    console.log(`${i.user.username} clicked ${i.customId}`);
    switch (i.customId) {
      case buttonOptions.in:
        if (!confirmedPlayers.find(playerIdentity(i))) {
          eRemover(condiPlayers, i); //remove player from Condi if they're in it
          confirmedPlayers.push({ player: i.user });
          await partyThread.members.add(i.user);
          if (confirmedPlayers.length > 4) {
            collector.stop("That's enough!");
          }
        }
        break;

      case buttonOptions.condi:
        if (!condiPlayers.find(playerIdentity(i))) {
          eRemover(confirmedPlayers, i); //remove player from IN if they're in it
          await modalThing(i, condiPlayers, confirmedPlayers);
        }
        break;

      case buttonOptions.dummy:
        const dummyArray = interaction.guild.members.cache.filter(
          dummy =>
            dummy.user.bot && !confirmedPlayers.find(d => d.player == dummy)
        );
        //each element in the array from .filter() is itself an array, wherein the first
        //element is just the userID and the second is the member object
        const dummy = shuffle(dummyArray)[0][1];
        if (dummy) {
          await dummySystem(i, condiPlayers, confirmedPlayers, dummy);
          if (confirmedPlayers.length > 4) {
            collector.stop("That's enough!");
          }
        }
        break;

      case buttonOptions.out:
        eRemover(condiPlayers, i);
        eRemover(confirmedPlayers, i);
        break;
    }
    if (!i.replied) {
      await i.update({
        embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
      });
    }
  });

  collector.on('end', async collected => {
    if (confirmedPlayers.length < 5) {
      await dotaMessage.edit({
        content: 'Looks like you ran out of time, darlings!',
        components: [],
      });
    } else {
      //Time for a ready check
      const memberArray = userToMember(confirmedPlayers, interaction);
      ljudGöraren.ljudGöraren(memberArray);
      console.log('Line 159');
      readyChecker(confirmedPlayers, dotaMessage, partyThread);
    }
  });
}

async function readyChecker(confirmedPlayers, partyMessage, partyThread) {
  const readyArray = [];
  const time = getTimestamp(1000);
  const miliTime = getTimestamp(1);
  for (let player of confirmedPlayers) {
    readyArray.push({ gamer: player.player, ready: false });
  }
  const filter = i =>
    i.channel.id === partyMessage.channel.id && i.customId in readyOptions;

  const collector = partyMessage.channel.createMessageComponentCollector({
    filter,
    time: READYTIME * 1000,
  });

  collector.on('collect', async i => {
    const pickTime = getTimestamp(1);
    console.log(i.user.username + ' clicked ' + i.customId);
    switch (i.customId) {
      case readyOptions.rdy:
        const player = readyArray.find(e => {
          return e.gamer.id === i.member.user.id && e.ready === false;
        });
        if (player) {
          player.ready = true;
          player.pickTime = pickTime - miliTime;
        }
        if (everyoneReady(readyArray)) {
          console.log('Now stopping');
          collector.stop("That's enough");
        }
        break;

      case readyOptions.stop:
        collector.stop('Someone wants out!');
        break;

      case readyOptions.sudo:
        forceReady(readyArray, pickTime, miliTime);
        collector.stop();
        break;

      case readyOptions.ping:
        await i.deferReply();
        pingMessage(readyArray, partyThread);
        await i.deleteReply();
        break;
    }
    if (!i.deferred) {
      await i.update({
        embeds: [readyEmbed(readyArray)],
      });
    }
  });

  collector.on('end', async collected => {
    console.log(
      `Now stopping and removing components, the final interaction was: ${
        collected.last() ? collected.last().customId : `Nothing!`
      }`
    );
    await partyMessage.edit({
      comopnents: [],
      embeds: [readyEmbed(readyArray)],
    });
    console.log(`Everyone ready ser ut såhär: ${everyoneReady(readyArray)}`);
    if (!everyoneReady(readyArray)) {
      const time = getTimestamp(1000);
      const redoButton = rowBoat('Re-Check', 'redo');
      switch (collected.last()?.customId) {
        case readyOptions.stop:
          await partyMessage.edit({
            content: `${collected
              .last()
              .member.toString()} stopped the ready check. Option to Re-Check closes <t:${
              time + FIVEMINUTES
            }:R>`,
            components: [redoButton],
          });
          await redoCollector(partyMessage, confirmedPlayers, partyThread);
          return;

        default:
          await partyMessage.edit({
            content: `Ready check failed after ${READYTIME.toString()} seconds. Option to Re-Check closes <t:${
              time + FIVEMINUTES
            }:R>`,
            components: [redoButton],
          });
          await redoCollector(partyMessage, confirmedPlayers, partyThread);
          return;
      }
    } else {
      const stackButton = rowBoat('Stack it!', 'stack');
      let finalMessage = '';
      switch (collected.last().customId) {
        case readyOptions.sudo:
          const readyLast = collected.last().member.toString();
          finalMessage = `${readyLast} used FORCED READY! You should be safe to stack, if not blame ${readyLast}`;
          break;

        case readyOptions.rdy:
        case readyOptions.ping: //in freak cases "ping" can be the last one
          finalMessage = "Everyone's ready!";
          break;
      }
      await partyMessage.edit({
        content: finalMessage,
        components: [stackButton],
      });
      await stackIt(partyMessage, confirmedPlayers, partyThread);
    }
  });

  const embed = readyEmbed(readyArray);
  partyMessage.edit({
    content: `Ready check closes <t:${time + READYTIME}:R>`,
    embeds: [embed],
    components: rdyButtons(),
  });
}

async function redoCollector(partyMessage, confirmedPlayers, partyThread) {
  const filter = i =>
    i.channel.id === partyMessage.channel.id && i.customId === 'redo';
  const collector = partyMessage.channel.createMessageComponentCollector({
    filter,
    time: FIVEMINUTES * 1000,
    max: 1,
  });
  collector.on('collect', async i => {
    await handleIt(i, 'Again!');
  });

  collector.on('end', async collected => {
    switch (collected.last()?.customId) {
      case 'redo':
        readyChecker(confirmedPlayers, partyMessage, partyThread);
        return;
      default:
        await partyMessage.edit({
          content: 'Ready check failed.',
          components: [],
        });
        break;
    }
  });
}
async function pThreadCreator(interaction, dotaMessage) {
  const partyThread = await dotaMessage.startThread({
    name: `🍹${interaction.user.username}'s Pre-Game Lounge 🍹`,
    autoArchiveDuration: 60,
    reason: 'Time for stack!',
  });
  return partyThread;
}

async function stackIt(message, confirmedPlayers) {
  const filter = i => i.message.id === message.id && i.customId === 'stack';
  const collector = message.channel.createMessageComponentCollector({
    filter,
    time: FIVEMINUTES * 1000,
    max: 1,
  });
  collector.on('collect', async i => {});

  collector.on('end', async collected => {
    await message.edit({ components: [] });
    if (collected.last()) {
      const interaction = collected.last();
      const choices = confirmedPlayers.map(cP => cP.player.id); //badaBing takes an array of player IDs, not player objects
      const shuffledChoices = shuffle(choices);

      const channel = await interaction.member.guild.channels.cache.get(
        TRASH_CHANNEL
      );
      const stackThread = await channel.threads.create({
        name: interaction.user.username + "'s Dota Party",
        autoArchiveDuration: 60,
        reason: 'Time for stack!',
      });
      await badaBing.badaBing(
        interaction,
        shuffledChoices,
        standardTime,
        stackThread
      );
      const button = linkButton(stackThread, 'Stack Thread');
      await message.edit({
        content: 'Stack is running in the Stack Thread!',
        components: [button],
      });
    } else {
      await message.edit({
        content: "You actually don't seem all that ready.",
      });
    }
  });
}

async function dummySystem(interaction, condiPlayers, confirmedPlayers, dummy) {
  //this is  a little busy
  const modal = new ModalBuilder()
    .setCustomId('textCollector')
    .setTitle('Ok, buddy');
  const avatarInput = new TextInputBuilder()
    .setCustomId('avatar')
    .setLabel('Which Dummy is the Dummy representing?')
    .setPlaceholder('The Dummy this Dummy is representing is...')
    .setMaxLength(140)
    .setStyle(TextInputStyle.Short);
  const modalInput = modalComponent(avatarInput);
  modal.addComponents(modalInput);
  await interaction.showModal(modal);
  const submitted = await interaction
    .awaitModalSubmit({
      time: READYTIME * 1000,
      filter: i => i.user.id === interaction.user.id,
    })
    .catch(error => {
      console.error(error);
      return null;
    });
  if (!submitted) {
    await interaction.update({
      embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
    });
    return;
  }
  const representing = ` *avatar of **${submitted.fields.getTextInputValue(
    'avatar'
  )}***`;
  confirmedPlayers.push({
    player: dummy,
    representing: representing,
  });

  await submitted.update({
    embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
  });
}

async function modalThing(interaction, condiPlayers, confirmedPlayers) {
  //this is  a little busy
  const modal = new ModalBuilder()
    .setCustomId('textCollector')
    .setTitle('Ok, buddy');
  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel("What's the holdup? Include ETA")
    .setPlaceholder("Describe what's stopping you from being IN RIGHT NOW")
    .setMaxLength(140)
    .setStyle(TextInputStyle.Short);
  const modalInput = modalComponent(reasonInput);
  modal.addComponents(modalInput);
  await interaction.showModal(modal);
  const submitted = await interaction
    .awaitModalSubmit({
      time: READYTIME * 1000,
      filter: i => i.user.id === interaction.user.id,
    })
    .catch(error => {
      console.error(error);
      return null;
    });
  if (!submitted) {
    await interaction.update({
      embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
    });
    return;
  }
  const time = getTimestamp(1000);
  const condition = `${submitted.fields.getTextInputValue(
    'reason'
  )} *(written <t:${time}:R>)*`;
  condiPlayers.push({ player: interaction.user, condition: condition });

  await submitted.update({
    embeds: [prettyEmbed(confirmedPlayers, condiPlayers)],
  });
}

function prettyEmbed(confirmedPlayers, condiPlayers) {
  const maxLength = 5;
  const playerFields = [];
  const conditionalFields = [];
  const embedFields = [];
  for (let i = 0; i < maxLength; i++) {
    let field = '';

    if (confirmedPlayers[i]) {
      playerFields.push(
        confirmedPlayers[i].player.toString() +
          (confirmedPlayers[i].representing || '')
      );
    } else {
      playerFields.push(`${`\`\`Open slot\`\``}`);
    }
  }
  embedFields.push({
    name: "*Who's up for Dota?*",
    value: playerFields.join('\n'),
  });

  if (condiPlayers.length > 0) {
    condiPlayers.map(e => {
      conditionalFields.push(`${e.player} ${e.condition}`);
    });
    embedFields.push({
      name: '*Conditionally In*',
      value: conditionalFields.join('\n'),
    });
  }

  const embed = {
    color: readyColours[confirmedPlayers.length],
    fields: embedFields,
  };
  return embed;
}

function readyEmbed(readyArray) {
  const playerFields = [];
  let rAmount = 0;
  for (let player of readyArray) {
    if (player.ready) {
      rAmount++;
      playerFields.push(
        `${stringPrettifier(player.gamer.toString())} \`\`readied in ${
          player.pickTime / 1000
        }\`\`✅`
      );
    } else {
      playerFields.push(`${stringPrettifier(player.gamer.toString())}❌`);
    }
  }
  const embed = {
    color: readyColours[rAmount],
    fields: [
      { name: '**R E A D Y  C H E C K**', value: playerFields.join('\n') },
    ],
  };
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yapos')
    .setDescription('Time to gauge dota interest')
    .addUserOption(option =>
      option.setName('p2').setDescription('Anyone else?').setRequired(false)
    )
    .addUserOption(option =>
      option.setName('p3').setDescription('Anyone else?').setRequired(false)
    )
    .addUserOption(option =>
      option.setName('p4').setDescription('Anyone else?').setRequired(false)
    )
    .addUserOption(option =>
      option.setName('p5').setDescription('Anyone else?').setRequired(false)
    ),

  async execute(interaction) {
    const confirmedPlayers = arrayMaker(interaction);
    if (!confirmedPlayers) {
      interaction.reply(
        'Please provide unique players!\nLove, **ShortStack!**'
      );
      return;
    }

    interaction.deferReply();
    interaction.deleteReply();
    await setUp(interaction, confirmedPlayers);
  },
};
