const { read } = require("jimp");

const fs = require("fs").promises;
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
let ready = false;
class CommandStats {

	constructor(bot) {
		this.data = [];
		this.init();
		
	}
	async init() {
		let rf;
		try {
			rf = await fs.readFile("./assets/commandStats.json");
			this.data = JSON.parse(rf.toString());
		} catch (error) {
			rf = [];
		}
		
		// let writing = false;
		(async () => {
			while (true) {
				// writing = true;
				await fs.writeFile("./assets/commandStats.json", JSON.stringify(this.data));
				
				await sleep(5000);
				// writing = false; 
			}
		})();
		ready = true;
	}
	async addData(commandName, user,guild, str) {
		while (!ready){
			await sleep(5);
		}
		let cmdData = {
			command: commandName,	
			guild: guild,
			user: user,
			cont: str,
		};
		this.data.push(cmdData);
	}
}
module.exports = CommandStats;