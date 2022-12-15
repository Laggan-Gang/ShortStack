const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
} = require("@discordjs/voice");

module.exports = {
  ljudGöraren: async function ljudGöraren(confirmedPlayers) {
    const aleaIactaEst = Math.floor(Math.random() * 50);
    let ljudfil = "bow bow.wav";
    switch (true) {
      case inRange(aleaIactaEst, 0, 0):
        ljudfil = "IASID.wav";
        console.log("IASID");
        break;
      case inRange(aleaIactaEst, 1, 5):
        ljudfil = "mitchyapos.wav";
        console.log("mitchyapos");
        break;
      case inRange(aleaIactaEst, 6, 10):
        ljudfil = "hugoyapos.wav";
        console.log("hugo");
        break;
      case inRange(aleaIactaEst, 11, 15):
        ljudfil = "claesyapos.wav";
        console.log("claes");
        break;
      case inRange(aleaIactaEst, 16, 20):
        ljudfil = "edwinyapos.wav";
        console.log("edwin");
        break;
      case inRange(aleaIactaEst, 21, 25):
        ljudfil = "sarayapos.wav";
        console.log("sara");
        break;
      case inRange(aleaIactaEst, 26, 30):
        ljudfil = "densetsuyapos.wav";
        console.log("Laggan gaiden");
        break;
      case inRange(aleaIactaEst, 31, 35):
        ljudfil = "sarayapos2.wav";
        console.log("sara");
        break;
      case inRange(aleaIactaEst, 36, 40):
        ljudfil = "onyourmarksyapos.wav";
        console.log("On your marks");
        break;
      case inRange(aleaIactaEst, 41, 45):
        ljudfil = "garboyapos.wav";
        console.log("woof woof");
        break;

      default:
        console.log("default");
        break;
    }
    let channel = meddelande.member.voice.channel;

    if (channel == undefined) {
      return;
    }

    const player = createAudioPlayer();
    let resource = createAudioResource("./ljudklipp/" + ljudfil);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    const subscription = connection.subscribe(player);
    player.play(resource);
    await löftesKollaren(player);
    if (subscription) {
      subscription.unsubscribe();
      connection.destroy();
      player.stop();
    }
    return console.log("Eftersom jag retrurnar har jag tänkt på det");
  },
};

function löftesKollaren(player) {
  const ed = new Promise((resolve, reject) => {
    player.on(AudioPlayerStatus.Idle, function filibuster() {
      resolve();
    });
  });
  return ed;
}
