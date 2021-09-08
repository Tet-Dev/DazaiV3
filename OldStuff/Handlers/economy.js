
var ytdl = require("ytdl-core");
// const SQLHandler = require("../../sqlHandler/SQLCommunicator");
function SecsToFormat(string) {
	var sec_num = parseInt(string, 10);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - hours * 3600) / 60);
	var seconds = sec_num - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	return hours + ":" + minutes + ":" + seconds;
}
let sqlConnection = null;
let bot;
let getBal;
let setBal;
class EconomyHandler {
	constructor(b) {
		sqlConnection = b.SQLHandler;
		bot = b;
		getBal = this.getBal;
		setBal = this.setBal;
	}

	getBal(id) {
		// sqlConnection = this.sqlConnection;
		
		return new Promise(function (resolve, rej) {
			sqlConnection.query("SELECT * FROM nadekoguilddata.dazcoin WHERE userid=" + sqlConnection.clean(id)).then((x) => {
				if (x && x.length) {

					resolve(x[0].coins);
				} else {
					bot.getRESTUser(id).then(() => {
						sqlConnection.query("INSERT INTO `nadekoguilddata`.`dazcoin` (`userid`, `coins`) VALUES ('" + id + "', '0')").then(() => {
							getBal(id).then(y => {
								resolve(y);
							});

						});
					}).catch(() => rej("No user!"));

				}
			});

		});
	}
	setBal(id,coins){
		return new Promise(function (resolve, rej) {
			getBal(id).then(() => {
				sqlConnection.query("UPDATE `nadekoguilddata`.`dazcoin` SET `coins` = " + coins + " WHERE `userid` = \"" + sqlConnection.clean(id) + "\"").then(() => {
					resolve(true);
	
				}).catch(er => rej(er));
			});
	
		});
	}
	async postToAuditLog(id,coins,memo){
		getBal(id).then(x => {
			bot.getRESTUser(id).then(async (user) => bot.createMessage("775098409916563466", {
				embed: {
					"title": "Transaction",
					"description": (coins >= 0?"+":"-") + (coins >= 0? coins:coins*-1) + " Coins\n" + memo,
					"author": {
						"name": user.username + "#" + user.discriminator,
						"icon_url": user.avatarURL,
					},
					color: (coins>=0? 720640:16763904),
					"footer": {
						"text": "New Balance: " + x+ " Daz Coins"
					}

				},
			}
			));
			// setUserBal(id, x.coins + coins).then(y => resolve(true));

		});
	}
	async addToBal(id,amnt,reason,silent){
		let cbal = await this.getBal(id);
		await this.setBal(id,amnt+cbal);
		if (!silent) await this.postToAuditLog(id,amnt,reason);
		return true;
	}
	async takeFromBal(id,amnt,reason,silent){
		return this.addToBal(id,amnt*-1,reason,silent);
	}
	async sendMoney(sender,reciever,amnt,memo){
		let res = await bot.getRESTUser(reciever);
		let sen = await bot.getRESTUser(sender);
		await this.takeFromBal(sender,amnt,"Sending "+amnt+" DazCoins to "+res.username+"(ID "+reciever+")");
		await this.addToBal(reciever,Math.floor(amnt*.85),"Recieving "+Math.floor(amnt*.85)+" DazCoins (15% Tax) from "+sen.username+"(ID "+sender+")"+(memo? "\n**__Memo__**\n"+memo:""));
		return true;
	}
}
module.exports = EconomyHandler;