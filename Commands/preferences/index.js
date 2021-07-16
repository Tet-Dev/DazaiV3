const { Command } = require("eris-boiler/lib");
const autoselectMusic = require("./autoselectMusic");

module.exports = new Command({
    name: "preferences",
    desc: "Sets your preferences for the bot",
    options: {
        subCommands: [
            autoselectMusic
        ],
        aliases: ["pref", "prefs"],
        
    },
    run: async function (bot, context) {
        return {
            embed: {
                title: "Preferences",
                thumbnail: {
                    url: bot.user.avatarURL,
                },
                fields: await Promise.all(this.subCommands.map(async cmd => ({
                    name:cmd.displayName,
                    value: `\`\`\`js\n${await cmd.getValue(bot, context)}\`\`\` \nSubcommand: \`${cmd.name}\``,
                    inline: true,
                    color: 0x3498db,
                }))),
            },
        }
    }
});