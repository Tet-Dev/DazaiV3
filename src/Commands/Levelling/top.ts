import { GuildCommand } from "eris-boiler";

export const top = new GuildCommand({
  name: "top",
  description: "Shows the top 10 users with the most xp.",
  options: {
    aliases: ["leaderboard", "lb", "top10", "top10xp"],
  },
  run: async (bot,context) => {

    return "WIP";
  }
})