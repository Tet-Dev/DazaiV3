// Importing the Constants object from the Eris library
import { Constants } from 'eris';

// Importing the Command type from the miscellaneous types folder
import { Command } from '../../types/misc';

// Importing the InteractionCollector class from the InteractionCollector file
import { InteractionCollector } from '../../Handlers/InteractionCollector';

// Defining the 'ping' command as an object
export const ping = {
  // Command name
  name: 'ping',

  // Command description
  description: 'Pings the bot',

  // Command arguments
  args: [],

  // Command type - this is a chat input command
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // Execution function for the command
  execute: async (bot, { interaction }) => {
    // Store the current time
    const start = Date.now();

    // Send a message to indicate that the bot is being pinged
    await interaction.createMessage('Pinging...');

    // Store the current time again
    const end = Date.now();

    // Initialize a clicks variable
    let clicks = 0;

    // Send a follow-up message to indicate that the bot has been pinged, and include an 'action row' component
    const msg = await interaction.createFollowup({
      content: `Pong! Took ${end - start}ms`,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              // This is a button component
              type: Constants.ComponentTypes.BUTTON,

              // The label for the button
              label: 'Try again',

              // The style of the button - this is a primary style button
              style: Constants.ButtonStyles.PRIMARY,

              // The emoji for the button
              emoji: {
                name: '🔁',
                animated: true,
              },

              // The custom ID for the button
              custom_id: 'tryagain',
            },
          ],
        },
      ],
    });

    // Start collecting interactions from users who click the 'Try again' button
    InteractionCollector.getInstance().collectInteraction(
      {
        // The ID for the interaction
        interactionid: 'tryagain',

        // The function to run when an interaction is collected
        run: async (bot, interaction) => {
          // Increment the clicks variable
          // clicks++;

          // Edit the message to display the amount of time it took for the interaction to occur
          await msg.edit(
            `Interaction took ${Date.now() - interaction.createdAt}ms`
          );
        },

        // The maximum number of interactions to collect
        limit: 5,

        // An array of user IDs to whitelist - only users in this array will be able to interact with the bot
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },

      // The message to collect interactions from
      msg,

      // The amount of time to wait before stopping the interaction collection
      1000 * 20
    );

    // End the execution of the command
    return;
  },
} as Command;

// Export the 'ping' command as the default export for this file
export default ping;
