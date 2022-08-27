const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Replies with Pong!"),
    async execute(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pos1')
                    .setLabel('Pos 1')
                    .setStyle(ButtonStyle.Primary),
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId('pos2')
                    .setLabel('Pos 2')
                    .setStyle(ButtonStyle.Primary),
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId('pos3')
                    .setLabel('Pos 3')
                    .setStyle(ButtonStyle.Primary),
            );
        const row2 = new ActionRowBuilder().
            addComponents(
                new ButtonBuilder()
                    .setCustomId('pos4')
                    .setLabel('Pos 4')
                    .setStyle(ButtonStyle.Primary),
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId('pos5')
                    .setLabel('Pos 5')
                    .setStyle(ButtonStyle.Primary),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('posfill')
                    .setLabel('Fill')
                    .setStyle(ButtonStyle.Secondary),
            );;
        const embed = new EmbedBuilder()
            .setColor(((Math.random() * 0xffffff) << 0).toString(16))
            .setTitle('Some title')
            .setURL('https://discord.js.org')
            .setDescription('Some description here');

        await interaction.reply({ content: 'Pong!', embeds: [embed], components: [row, row2] });
    }
};