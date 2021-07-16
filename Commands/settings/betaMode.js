const { SettingCommand } = require("eris-boiler/lib");

module.exports = new SettingCommand({
	name: "mode",
	description: "Sets the current bot mode to either Beta or normal. Beta mode grants extra features but may be less stable than the normal version.",
	options: {
		parameters: [ "Beta/Normal" ],
		permissionNode: "admin",
		// permission
	},
	displayName: "Bot Mode",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const beta = dbGuild.beta;

		if (!beta) {
			return "Regular";
		}

		return beta == 1? "BETA":"Regular";
	},
	run: async (bot, { msg, params }) => {
		// const [ roleId ] = params;
		const fullParam = params.join(" ").toLowerCase();

		// const guild = msg.channel.guild;
		const role = fullParam.includes("beta") || fullParam.includes("normal") ? (fullParam === "beta"? 1:0):false;
		if (role === false) return "Choice must be either `beta` or `normal`";
		const dbGuild = await bot.SQLHandler.getGuild(msg.guildID);
		if (role === dbGuild.beta) {
			return `The server was already in ${role? "Beta":"Regular"} mode!`;
		}

		await bot.SQLHandler.updateGuild(msg.guildID,{ beta: role });
		return `The server is now ${(role? "in **BETA** mode.":"no longer in **BETA** mode")}`;
	}
});
