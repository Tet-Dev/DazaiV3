const { DataClient } = require("eris-boiler");
const express = require("express");
class WebServer {
	/**
 * Class representing a settings command.
 * <T extends DataClient>
 * @param {DataClient} bot The Dataclient.
 */
	constructor(bot) {
		this.bot = bot;
		const app = express();
		app.get("/shardStats", async (req, res) => {
			res.status(200).json({
				guilds: bot.guilds.size,

			});
		});
		app.get("/ping",async (req,res)=>{
			res.status(200).json("Pong!");
		});
	}
}
module.exports = WebServer;
