const { DiscordEvent } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const { sleep } = require("../Handlers/TetLib");
const TetLib = require("../Handlers/TetLib");
module.exports = new DiscordEvent({
	name: "voiceChannelLeave",
	run: async (bot, mem, oldChannel, newChannel) => {
		try {
			if (mem.id === bot.user.id) {
				MusicHandler.stop(mem.guild.id);
			}
			if (bot.getChannel(bot.voiceConnections.get(mem.guild.id).channelId).voiceMembers.filter(member=>!member.bot).length === 0) {
				setTimeout(() => {
					if (bot.getChannel(bot.voiceConnections.get(mem.guild.id).channelId).voiceMembers.filter(member=>!member.bot).length === 0){
    
						MusicHandler.getGuildData(mem.guild.id).channelBound.createMessage({
							embed: {
								color: 0xFF0000,
								name: "Anyone There??",
								description: "Everyone seems to have ditched me :(. I'll stop playing music to save bandwidth. You can always resummon me when you get back!",
								timestamp: new Date(),
							}
						});
						MusicHandler.stop(mem.guild.id);
					}
				}, 60000*5);
			}
		} catch (error) {
            
		}

	}
});