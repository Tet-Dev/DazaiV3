const { Command } = require("eris-boiler/lib");
const SQLHandler = require("../../Handlers/SQLHandler");
module.exports = new Command({
    name: "autoselectmusic",
    displayName: "Auto Select Music",
    description: "Auto-select the top result from the list of songs",
    options: {
        parameters: ["`on` or `off`"],
        
    },
    getValue: async (bot, {channel,msg}) => {
        return SQLHandler.getUser(msg.author.id).then(user => {
            if (user.autoSelectSongs === 1) {
                return "On";
            } else {
                return "Off";
            }
        });
    },
    run: (bot, {msg,params}) => {
        let toggle = params[0];
        if (toggle === "on") {
            SQLHandler.setUser(msg.author.id, {autoSelectSongs: 1});
            return (`Auto-select songs is now on`);
        } else if (toggle === "off") {
            SQLHandler.setUser(msg.author.id, {autoSelectSongs: 0});
            return (`Auto-select songs is now off`);
        } else {
            return (`Invalid option, valid options are \`on\` and \`off\``);
        }
    },
});