import { DiscordScript } from '../types/misc';
import mysql2 from 'mysql2/promise';
import { XPManager } from '../Handlers/Levelling/XPManager';
import { InventoryManager } from '../Handlers/Crates/InventoryManager';
import { getGuildCards } from '../Handlers/Crates/CardManager';
import { CardType } from '../constants/cardNames';
let timonTroller = 0;
export const sellAllButOneScript: DiscordScript = async (bot, interaction) => {
  const guildID = interaction.guildID;
  if (!guildID) {
    return interaction.createMessage({
      embeds: [
        {
          title: `Cannot run script`,
          description: `This command can only be used in a server!`,
          color: 16728385,
        },
      ],
    });
  }
  console.log('acking...');
  await interaction.acknowledge();
  const start = Date.now();
  const userID = interaction.user?.id || interaction.member?.id;
  if (!userID) {
    return interaction.createMessage({
      embeds: [
        {
          title: `Cannot run script`,
          description: `Could not find user ID!`,
          color: 16728385,
        },
      ],
    });
  }
  const inventory = await InventoryManager.getInstance().getUserInventory(
    userID,
    guildID
  );
  const guildCards = await getGuildCards(guildID);
  const guildCardsMap = new Map<string, CardType>();
  guildCards.forEach((card) => guildCardsMap.set(card._id.toString(), card));

  const items = inventory.cards;
  const sellableItems = items.filter(
    (item) => !!guildCardsMap.get(item.cardID)?.sellPrice
  );
  const keepItemsMap = new Map<string, string>();
  // set up keep items map. key should be card ID, value should be inventory item id, or item.id
  sellableItems.forEach((item) => {
    if (!keepItemsMap.has(item.cardID)) {
      keepItemsMap.set(item.cardID, item.id);
    }
  });
  // filter out keep items
  const itemsToSell = sellableItems.filter(
    (item) => item.id !== keepItemsMap.get(item.cardID)
  );
  const totalValue = itemsToSell.reduce(
    (acc, item) => acc + guildCardsMap.get(item.cardID!)?.sellPrice! || 0,
    0
  );
  // create an inventory after the sell, keeping all value entries from keepItemsMap
  const inventoryAfterSell = {
    ...inventory,
    cards: inventory.cards.filter((item) =>
      keepItemsMap.has(item.cardID)
        ? item.id === keepItemsMap.get(item.cardID)
        : true
    ),
    money: totalValue + (inventory.money || 0),
  };
  // calculate total value of items to sell

  // update inventory
  if (
    (interaction.member?.id || interaction.user?.id) === '595719716560175149'
  ) {
    if (timonTroller % 8 === 0) {
      timonTroller += Math.floor(Math.random() * 4) + 1;
      return interaction.createMessage({
        embeds: [
          {
            title: `Re-distributed ${totalValue}円 worth of cards across the server (${itemsToSell.length} cards)`,
            description: `You recieved \`0円\``,
            color: 16728385,
            image: {
              url: `https://media.discordapp.net/attachments/757863990129852509/1090403439026131036/Communist_Bugs_Bunny_Banner.png`,
            },
          },
        ],
      });
    }
    timonTroller += Math.floor(Math.random() * 4) + 1;
    // add random 1-4 to timonTroller

    // cap timonTroller at 8
    if (timonTroller >= 8) {
      timonTroller = 0;
    }
  }

  await InventoryManager.getInstance().updateInventory(
    userID,
    guildID,
    inventoryAfterSell
  );
  return interaction.createMessage({
    embeds: [
      {
        title: `Sold ${itemsToSell.length} cards for ${totalValue} Yen!`,
        description: `Took ${Date.now() - start}ms`,
        color: 16728385,
      },
    ],
  });
};
