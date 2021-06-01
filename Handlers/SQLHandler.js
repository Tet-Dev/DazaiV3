const mysql = require("mysql2");
class SQLHandler {
	/** @type {SQLHandler} */
	static sql = null;
	constructor() {
		this.guildDB = mysql.createPool({
			host: process.env.SQLHOST,
			user: process.env.SQLUSER || "root",
			password: process.env.SQLPASSWORD,
			database: process.env.SQLDATABASE,
			charset: "utf8mb4",
		});
		this.guildDB.on("error", function (err) {
			console.trace("db error", err);

			if (err.code === "PROTOCOL_CONNECTION_LOST") {
				this.handleDisconnect();
			} else {

				throw err;
			}
		});
	}
	static init(){
		SQLHandler.sql = new SQLHandler();
	}
	static clean(str) {
		return str.replace(/[";`']/g, m => "\\" + m);
	}
	handleDisconnect() {
		(() => {
			this.guildDB = mysql.createPool({
				host: "sql.dazai.app",
				user:  process.env.SQLUSER || "root",
				password: process.env.SQLPASSWORD,
				database: "nadekoguilddata",
				charset: "utf8mb4",
			});
		})();

	}
	queryDB(str) {
		return new Promise((resolve, reject) => {
			if (!this || !this.guildDB) {
				reject("Object not Initiated");
			} else {
				this.guildDB.query(str, function (err, res) {
					(err ? reject(err) : resolve(res));
				});
			}
		});
	}
	static query(str) {
		return SQLHandler.sql.queryDB(str);
	}

	static async genericGet(db,keyname,keyval,disableCreateIfNull,dirty,getInArr){

		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty?keyname:SQLHandler.clean(keyname)} = "${dirty?keyval:SQLHandler.clean(keyval)}"`);
		if (!data || !data.length){
			await SQLHandler.genericSet(db,keyname,keyval);
			data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty?keyname:SQLHandler.clean(keyname)} = "${dirty?keyval:SQLHandler.clean(keyval)}"`);
		} 
		return getInArr? data:data[0];
	}
	static async genericGetAll(db){

		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db}`);
		return data;
	}
	static async genericSet(db,keyname,keyval,updateOBJ){
		try {
			let adds = updateOBJ? Object.keys(updateOBJ):[];
			let vals = updateOBJ? Object.values(updateOBJ):[];
			vals = vals.map(x=>SQLHandler.clean(x+""));
			await SQLHandler.query(`INSERT INTO \`nadekoguilddata\`.\`${db}\` (\`${keyname}\` ${adds.length?",`"+adds.join("`,`")+"`":""}) VALUES ('${keyval}'${vals.length? ",'"+vals.join("','")+"'":""})`);
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
	static async genericUpdate(db,keyname,keyval,updateOBJ){
		try {
			let adds = Object.keys(updateOBJ);
			adds = adds.map(x => "`" + x + "` = '" + updateOBJ[x] + "'");
			await SQLHandler.query("UPDATE `nadekoguilddata`.`"+db+"` SET " + adds.join(", ") + " WHERE (`"+keyname+"` = '" + SQLHandler.clean(keyval) + "')");
			return true;
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
	static async genericDelete(db,keyname,keyval,dirty){
		await SQLHandler.query(`DELETE FROM \`nadekoguilddata\`.\`${db}\` WHERE (\`${dirty?keyname:SQLHandler.clean(keyname)}\` = '${dirty?keyval:SQLHandler.clean(keyval)}')`);
	}
	static async getGuild(guildID){
		return await SQLHandler.genericGet("guilddata","id",guildID,false,true);
	}
}
module.exports = SQLHandler;