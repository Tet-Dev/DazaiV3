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
	}
};