import { NodeOptions } from "erela.js";

export const env = {
	postGuildJoinAndLeaveMessages: '790481772952813581',
	botMasters: ['295391243318591490'],
	// token: 'NzU1MjYwOTM0Njk5NzQ1NDQx.X2Atjg.F_sMLtQX9dBh-Ewl078UtF8x2Mk', //Beta
	token: 'ODc2NjM1MzQyNTY3MDA2MjI4.YRm8SA.K84egOX-zQUxH7rYZ1JgIMeVeHE', //Alpha
	SQLHOST: '150.230.35.220',
	SQLUSER: 'nadTest',
	SQLPASSWORD: 'k2tGgG44Zj1',
	SQLDATABASE: 'nadekoguilddata',
	shardID: 0,
	APIEP: 'http://api.dazai.app',
SPOTIFYID: '21ecf39ff60a471189d5411c37182e31',
	SPOTIFYSECRET: '547954723aa042568328e5a305741009',
	LavalinkNodes: JSON.stringify([
		{ host: '139.64.237.42', port: 2333 , password: 'dazaiAppTet$'},
		// { host: '158.51.87.205', port: 2333, region: 'us', password: 'dazaiAppTet$' },
	] as NodeOptions[]),
	GOOGLEAPIKEY: 'AIzaSyBS0NSP_Id2hssznycxsC9uY2YrSuMh14o',
	MongoURL: 'mongodb+srv://dazai:uRJZj6xd3m5nYyAh@cluster0.rda7f.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
	MusicDrawers: 1, //How many threads should be used to generate music cards
	RankCardDrawers: 2, //How many threads should be used to generate rank cards
};
export default env;
export type EnvData = typeof env;