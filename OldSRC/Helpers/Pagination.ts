import Eris from "eris";
import ReactionCollector from "../Handlers/ReactionsCollector";
import tetGlobal from "../tetGlobal";

class Pagination {
  embeds : Eris.Embed[];
  channelID: string;
  reactorFilter: (reactorID: string) => boolean;
  options: {timeout: number};
  currentPage: number;
  message?: Eris.Message;
  constructor(embeds: Eris.Embed[], channelID: string, reactorFilter: (reactorID: string) => boolean, options?: { timeout?: number }) {
    this.embeds = embeds;
    this.channelID = channelID;
    this.reactorFilter = reactorFilter;
    this.options = {
      timeout: options?.timeout ||  60 * 1000 * 5
    };
    this.currentPage = 0;
    /** @type {import("eris").Message} */
    this.start();
  }
  async start() {
    let bot = tetGlobal.Bot;
    this.message = await bot!.createMessage(this.channelID, {
      embed: this.embeds[this.currentPage],
      content: `Page ${this.currentPage + 1} of ${this.embeds.length}`
    });
    this.message.addReaction("⏮");
    this.message.addReaction("◀");
    this.message.addReaction("▶");
    this.message.addReaction("⏭");

    let collector = new ReactionCollector(this.message, this.reactorFilter, { time: this.options.timeout || 60 * 1000 * 5 });
    collector.on("collect", (_, emoji, userID) => {
      if (emoji.name === "⏮") {
        this.currentPage = 0;
        this.updateMessage();
      }
      if (emoji.name === "⏭") {
        this.currentPage = this.embeds.length - 1;
        this.updateMessage();
      }
      if (emoji.name === "◀") {
        this.currentPage--;
        this.updateMessage();
      }
      if (emoji.name === "▶") {
        this.currentPage++;
        this.updateMessage();
      }
      this.message!.removeReaction(emoji.name, userID.id ? userID.id : userID).catch(err => { console.trace(err) });
    });
  }
  async updateMessage() {
    this.currentPage = (this.embeds.length + this.currentPage) % (this.embeds.length);
    await this.message!.edit({
      embed: this.embeds[this.currentPage],
      content: `Page ${this.currentPage + 1} of ${this.embeds.length}`
    });
  }
}
export default Pagination;