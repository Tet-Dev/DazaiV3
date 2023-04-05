import { DiscordScript } from '../types/misc';
import { CrateManager } from '../Handlers/Crates/CrateManager';
export const giveCrates: DiscordScript = async (bot, interaction) => {
  if ((interaction.member || interaction.user)?.id !== env.adminID)
    return interaction.createMessage({
      embeds: [
        {
          title: `Cannot run script`,
          description: `You must be the bot owner to run this script!`,
          color: 16728385,
        },
      ],
    });

  console.log('acking...');
  await interaction.acknowledge();
  const start = Date.now();
  const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
    `63eb4ebb0296c1c2c951ba82`
  );
  if (!crateTemplate) return;
  // random between 2-4 crates
  const crateCount = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < crateCount; i++)
    await CrateManager.getInstance().generateCrate(
      crateTemplate,
      '@global',
      interaction.member ? interaction.member.user.id : interaction.user?.id!
    );
  await interaction.createMessage({
    embeds: [
      {
        title: `Crate(s) given`,
        description: `You have been given ${crateCount} crate(s)!`,
        color: 16728385,
      },
    ],
  });
};
