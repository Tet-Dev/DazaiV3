const { ReactionCollector, MessageCollector } = require("eris-collector");
/** @type {import("eris-boiler").DataClient} */
let bot = process.bot
class PaginationEmbed {
  /**
   * @param {Array<import("eris").Embed>} embeds
   * @param {String} channelID
   * @param {Function} reactionFilter
   * @param {PaginationEmbedOptions} options
   */
  constructor(embeds, channelID, reactorFilter, options) {
    this.embeds = embeds;
    this.channelID = channelID;
    this.reactorFilter = reactorFilter;
    this.options = options || {
      timeout: 60 * 1000 * 5
    };
    this.currentPage = 0;
    /** @type {import("eris").Message} */
    this.message = null;

  }
  async start() {

    this.message = await bot.createMessage(this.channelID, {
      embed: this.embeds[this.currentPage],
      content: `Page ${this.currentPage + 1} of ${this.embeds.length}`
    });
    this.message.addReaction("⏮");
    this.message.addReaction("⏭");
    this.message.addReaction("◀");
    this.message.addReaction("▶");

    let collector = new ReactionCollector(process.bot, this.message, this.reactorFilter, { time: this.options.timeout || 60 * 1000 * 5 });
    collector.on("collect", (m, emoji, userID) => {
      if (emoji === "⏮") {
        this.currentPage = 0;
        this.updateMessage();
      }
      if (emoji === "⏭") {
        this.currentPage = this.embeds.length - 1;
        this.updateMessage();
      }
      if (emoji === "◀") {
        this.currentPage--;
        this.updateMessage();
      }
      if (emoji === "▶") {
        this.currentPage++;
        this.updateMessage();
      }
    });
  }
  async updateMessage(){
    await this.message.edit({
      embed: this.embeds[this.currentPage],
      content: `Page ${this.currentPage + 1} of ${this.embeds.length}`
    });
  }
}

/**
 * @typedef {Object} PaginationEmbedOptions
 * @property {Number} timeout
 */
module.exports = PaginationEmbed;