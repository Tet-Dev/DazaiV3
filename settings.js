//Rename file to env.js and fill in the blanks
module.exports = {
	postGuildJoinAndLeaveMessages: "", //channelID
	botMasters: [""], //userIDs
	token: "", //bot token


	SQLHOST: "", //SQL Address
	SQLUSER: "", //SQL Username
	SQLPASSWORD: "", //SQL Password
	shardID: 0, //Shard ID (typically 0)


	APIEP: "", //Main API Endpoint
	SPOTIFYID: "", //Spotify ID
	SPOTIFYSECRET: "", //Spotify Secret
	LavalinkNodes: JSON.stringify([
		{ host: "", port: 2333, region: "us", password: "" }, //Host IP , Port, region and password
	]),
	GOOGLEAPIKEY: "", //Google API Key
};