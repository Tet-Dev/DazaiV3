const { Command } = require("eris-boiler");

module.exports = new Command({
	name: "help",
	description: "Displays this message :)",
	run: async (bot, {params,msg}) => {

		if (params[0]) {
			return commandInfo(bot, params[0]);
		}

		// const { commands, longName } = await filterCommands(bot, context);

		// const content = commands.reduce(
		//   (ax, { name, description, aliases }) => ax + `\n${name}` + (
		//     aliases.length > 0 ? '/' + aliases.join('/') : ''
		//   ) + ':' + ' '.repeat(longName - name.length) + description,
		//   'Available commands:```'
		// ) + '\n```\nTo get more information try: `help command`'
		msg.channel.createMessage({
			content: "",
			embed:{
				title: "Links",
				description: "[[Commands/Docs]](https://docs.dazai.app) [[Support Server]](https://discord.gg/jvqdyW8) [[Invite]](https://invite.dazai.app) [[Site]](https://dazai.app) ",
				image:{
					url: "https://github.com/icedTet/siteAssets/blob/main/help.png?raw=true "
				},
			}
		});
		// return {
		// 	dm: false,
		// 	content
		// };
	}
});

async function filterCommands (bot, context) {
	const commands = [];
	let longName = 0;
	for (const command of bot.commands.values()) {
		let {
			name,
			aliases,
			description
		} = command;
		aliases = aliases || [" "];
		longName = Math.max(
			name.length + aliases.join("/").length + 3, longName
		);
		commands.push({ name, description, aliases });
	}

	return { commands, longName };
}

function commandInfo (bot, cmd) {
	const command = bot.findCommand(cmd);

	if (!command) {
		return `${cmd} is not a command or alias!`;
	}

	return {
		dm: true,
		content: "```" + command.info + "```"
	};
}
