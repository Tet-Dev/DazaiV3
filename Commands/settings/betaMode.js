const { SettingCommand, StringArgument } = require("eris-boiler/lib");
const { StringArgumentChoice } = require("eris-boiler/lib/arguments/choices");

module.exports = new SettingCommand({
	name: "mode",
	description: "Sets the current bot mode to either Beta or normal.",
	options: {
		parameters: [ new StringArgument("bot_mode","beta or normal mode. Unlocks experimental features",false,[new StringArgumentChoice("beta","beta"),new StringArgumentChoice("normal","normal")])],
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
	run: async (bot, { msg, params ,channel}) => {
		// const [ roleId ] = params;
		const fullParam = params.join(" ").toLowerCase();

		const role = fullParam.includes("beta") || fullParam.includes("normal") ? (fullParam === "beta"? 1:0):false;
		if (role === false) return "Choice must be either `beta` or `normal`";
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		if (role === dbGuild.beta) {
			return `The server was already in ${role? "Beta":"Regular"} mode!`;
		}

		await bot.SQLHandler.updateGuild(channel.guild.id,{ beta: role });
		return `The server is now ${(role? "in **BETA** mode.":"no longer in **BETA** mode")}`;
	}
});
