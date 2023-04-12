// Importing required modules and files
import { Constants, InteractionDataOptionsString } from 'eris';
import { Command } from '../../types/misc';
import TetLib from '../../Handlers/TetLib';
import { migrateXP } from '../../Scripts/migrateXP';
import { sellAllButOneScript } from '../../Scripts/sellAllButOne';
import { giveCrates } from '../../Scripts/giveGlobalCrate';

// Script map containing available scripts and their functions
const scriptMap = {
  migratexp: migrateXP,
  sellall: sellAllButOneScript,
  ownercrategive: giveCrates,
};

// Defining the scriptRun command as a constant
export const scriptRun = {
  // Command name and description
  name: 'scriptrun',
  description:
    "Runs a specific script. Only run this command if you know what you're doing/are told to!",
  // Command arguments
  args: [
    {
      name: 'script',
      description: 'The script to run',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  // Command type
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Command execution function
  execute: async (bot, { interaction }) => {
    // Finding the script argument passed by the user
    const script = TetLib.findCommandParam(
      interaction.data.options,
      'script'
    ) as InteractionDataOptionsString;
    // Handling if the script argument is missing
    if (!script) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot run script`,
            description: `Please provide a script to run!`,
            color: 16728385,
          },
        ],
      });
    }
    // Handling if the script does not exist in the script map
    if (!scriptMap[script.value.toLowerCase() as keyof typeof scriptMap]) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot run script`,
            description: `That script does not exist!`,
            color: 16728385,
          },
        ],
      });
    }
    // Running the script function associated with the script key in the script map
    scriptMap[script.value.toLowerCase() as keyof typeof scriptMap](
      bot,
      interaction
    );
  },
} as Command;

// Exporting the scriptRun command as the default export
export default scriptRun;
