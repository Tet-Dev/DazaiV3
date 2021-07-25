// eslint-disable-next-line no-unused-vars
const { Member, User } = require("eris");

module.exports = {
	sleep: (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
	text_truncate: (str, len) => {
		let array = str.split("");
		array.length = len - 3;
		return array.join("") + "...";
	},
	SecsToFormat: (string) => {
		let sec_num = parseInt(string, 10);
		let hours = Math.floor(sec_num / 3600);
		let minutes = Math.floor((sec_num - hours * 3600) / 60);
		let seconds = sec_num - hours * 3600 - minutes * 60;
		if (hours < 10) hours = "0" + hours;
		if (minutes < 10) minutes = "0" + minutes;
		if (seconds < 10) seconds = "0" + seconds;
		return hours + ":" + minutes + ":" + seconds;
	},
	genID: (length) => {
		var result = "";
		var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	},
	/**
	 * 
	 * @param {Array<*>} array 
	 * @param {Number} length 
	 * @returns {Array<Array<*>>}
	 */
	splitArrayIntoChunks: (array, length) => {
		let res = [];
		while (array.length >= length) {
			res.push(array.splice(0, length));
		}
		if (array.length) res.push(array);
		return res;
	},
	/**
	 * Shuffles array in-place;
	 * @param {Array<*>} array
	 * @returns {Array<*>} 
	 */
	shuffle: (array) => {
		let counter = array.length;
		while (counter > 0) {
			let index = Math.floor(Math.random() * counter);
			counter--;
			[array[counter], array[index]] = [array[index], array[counter]];
		}
		return array;
	},
	/**
	 * Converts large number to a prefixed number (eg: 1435839 => 1.43m)
	 * @param {Number} num
	 * @returns {String}
	 */
	formatNumber(num) {
		if (num >= 1000000000) {
			return (num / 1000000000).toFixed(3).replace(/\.0$/, "") + "b";
		}
		if (num >= 1000000) {
			return (num / 1000000).toFixed(3).replace(/\.0$/, "") + "m";
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(3).replace(/\.0$/, "") + "k";
		}
		return num;
	},
	/**
	 * Gets a display string from a member (Teto#6942)
	 * @param {Member} member
	 * @param {Boolean} useNickname
	 * @returns {String} formatted name
	 */
	getMemberDisplayName(member,useNickname){
		return useNickname? `${member.nick || member.user.username}#${member.user.discriminator}` : this.getUserDisplayName(member.user);
	},
	/**
	 * Gets a display string from a user (Teto#6942)
	 * @param {User} user
	 * @returns {String} formatted name
	 */
	getUserDisplayName(user){
		return `${user.username}#${user.discriminator}`;
	},
};