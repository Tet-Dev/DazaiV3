import { Constants, InteractionDataOptionsString } from 'eris';
import nfetch from '../../Handlers/FixedNodeFetch';
import {
  slanderGIFMap,
  SlanderManager,
} from '../../Handlers/Fun/Slander/SlanderManager';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';

// Map to keep track of the cooldown of the "slander" command for each user
const slanderCooldowns = new Map<string, number>();

// Define a "slander" command object
export const slander = {
  name: 'slander',
  description: 'Concatenates `text` and `slander_type`',
  args: [
    {
      name: 'slander_type',
      description: 'the GIF to use, or URL to use',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'text',
      description: 'the slander',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // Function that gets executed when the "slander" command is used
  execute: async (bot, { interaction }) => {
    // Check if the command is being executed in a guild (server) context
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Extract the values of the "slander_type" and "text" parameters from the command input
    const slanderType = (
      TetLib.findCommandParam(
        interaction.data.options,
        'slander_type'
      ) as InteractionDataOptionsString
    )?.value;
    const text = (
      TetLib.findCommandParam(
        interaction.data.options,
        'text'
      ) as InteractionDataOptionsString
    )?.value;

    // If the "text" parameter is not provided, send an error message
    if (!text)
      return interaction.createMessage({
        embeds: [
          {
            title: `Invalid slander`,
            description: `You need to provide valid slander text!`,
            color: 16728385,
          },
        ],
      });

    // If the "slander_type" parameter is not provided or is invalid, send an error message
    if (!slanderType)
      return interaction.createMessage({
        embeds: [
          {
            title: `Invalid slander type`,
            description: `You need to provide a valid slander type! Valid slander types are: ${Object.keys(
              slanderGIFMap
            )
              .map((x) => `\`${x}\``)
              .join(', ')}`,
            color: 16728385,
          },
        ],
      });

    // Check if the "slander_type" parameter is a valid URL or a valid GIF name
    const slanderTypeIsURL = slanderType.match(
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    );
    const slanderTypeIsGIF =
      slanderGIFMap[slanderType as keyof typeof slanderGIFMap];
    if (!slanderTypeIsURL && !slanderTypeIsGIF)
      return interaction.createMessage({
        embeds: [
          {
            title: `Invalid slander type`,
            description: `You need to provide a valid slander type! Valid slander types are: ${Object.keys(
              slanderGIFMap
            )
              .map((x) => `\`${x}\``)
              .join(', ')}`,
            color: 16728385,
          },
        ],
      });

    // Check if the command is being used too frequently (i.e., if the user is on cooldown)
    const cooldown = slanderCooldowns.get(
      (interaction.member.user || interaction.user).id
    );
    if (cooldown && Date.now() - cooldown <= 0) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Slow down!`,
            description: `Please wait <t:${Math.floor(
              cooldown / 1000
            )}:R> before using this command again!`,
            color: 16728385,
          },
        ],
      });
    }

    // Set the user on cooldown for 30 seconds
    slanderCooldowns.set(
      (interaction.member.user || interaction.user).id,
      Date.now() + 1000 * 30
    );

    // Acknowledge the command input
    await interaction.acknowledge();

    // Measure the time it takes to generate the slander GIF
    let timeStart = Date.now();
    const slanderData = await SlanderManager.getInstance().slander(
      text,
      slanderType
    );
    console.log(`Slander took ${Date.now() - timeStart}ms`);

    // If the slander GIF is successfully generated, send it as a response to the command input
    if (slanderData) {
      // If the GIF is larger than 24MB, upload it to imgbb and send it as a URL-encoded response
      if (slanderData.buffer.byteLength > 24 * 1024 * 1024) {
        const data = await nfetch(
          `https://api.imgbb.com/1/upload?key=a30605f1da7b089b528b79988fdf09ba`,
          {
            method: 'POST',
            body: `image=${encodeURIComponent(
              Buffer.from(slanderData.buffer).toString('base64')
            )}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        ).then((x) => {
          console.log(x.status);
          return x.json();
        });
        console.log(data);
        return interaction.createFollowup({
          embeds: [
            {
              color: 16728385,
              image: {
                url: data.data.url,
              },
            },
          ],
        });
      } else {
        // If the GIF is smaller than or equal to 8MB, send it as an attachment
        return interaction.createFollowup(
          {
            embeds: [
              {
                color: 16728385,
                image: {
                  url: `attachment://Slander.gif`,
                },
              },
            ],
          },
          {
            file: Buffer.from(slanderData.buffer),
            name: `Slander.gif`,
          }
        );
      }
    }
  },
} as Command;
// Export the "slander" command object as the default export of this module
export default slander;
