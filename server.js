const { DataClient } = require("eris-boiler");
const SQLHandler = require("./Handlers/SQLHandler");
const {join} = require("path");
const MusicHandler = require("./Handlers/MusicV5");
const PermissionsHandler = require("./Handlers/permissionHandler");
const MusicDrawer = require("./Handlers/MusicDrawer");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
//Bind env vars :)
Object.assign(process.env, require("./env"));
//Split array function; Useful.
Object.defineProperty(Array.prototype, "chunk_inefficient", {
	value: function (chunkSize) {
		var array = this;
		return [].concat.apply([],
			array.map(function (elem, i) {
				return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
			})
		);
	}
});

//api host
// const api = process.env.APIEP;
// process.exit(0);

(async () => {
	const options = {
		oratorOptions: {
			defaultPrefix: "daz" // sets the default prefix to !!
		},
		statusManagerOptions: {
			defaultStatus: { // sets default discord activity
				type: 0,
				name: "daz help | Rewrite???"
			},
			mode: "random" // sets activity mode to random, the bot will change status on an interval
		},
		erisOptions: {
			restMode: true,
			defaultImageSize: 256,
			sendIDOnly: true,
			// firstShardID: Number(process.env.shardID),
			// lastShardID: Number(process.env.shardID),
		},
	};
	const bot = new DataClient(process.env.token, options);
	bot.SQLHandler = SQLHandler;
	process.bot = bot;

	/*
	=================
	Init Handlers
	=================
	*/
	SQLHandler.init();
	MusicDrawer.init();

	bot.botMasters = process.env.botMasters
	bot.token = process.env.token;
	bot.addCommands(join(__dirname, "Commands"));
	bot.addEvents(join(__dirname, "Events"));
	bot.snipes = new Map();
	bot.esnipes = new Map();
	bot.PermissionsHandler = new PermissionsHandler(SQLHandler,bot);
	bot.permissionsHandler = bot.PermissionsHandler;
	bot.guildsColl = [];
	await bot.connect();
	
	
	bot.on("ready", async () => {
		MusicHandler.init();
		bot.editStatus("online", {
			name: "daz help | V3 coming out???",
			type: 2,
		});
	});
})();