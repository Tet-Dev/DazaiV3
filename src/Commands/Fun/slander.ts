import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
  InteractionDataOptionsUser,
} from 'eris';
import nfetch from '../../Handlers/FixedNodeFetch';
import {
  slanderGIFMap,
  SlanderManager,
} from '../../Handlers/Fun/Slander/SlanderManager';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';
const slanderCooldowns = new Map<string, number>();
export const slander = {
  name: 'slander',
  description: 'Slander someone/something',
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
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
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
    // slander type must be a valid URL or a valid GIF name
    const slanderTypeIsURL = slanderType.match(
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
      ),
      slanderTypeIsGIF =
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
    // check cooldown
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
    slanderCooldowns.set(
      (interaction.member.user || interaction.user).id,
      Date.now() + 1000 * 30
    );

    await interaction.acknowledge();
    let timeStart = Date.now();
    const slanderData = await SlanderManager.getInstance().slander(
      text,
      slanderType
    );
    console.log(`Slander took ${Date.now() - timeStart}ms`);
    if (slanderData) {
      // if its > 8mb, upload to imgbb
      if (slanderData.buffer.byteLength > 8 * 1024 * 1024) {
        // upload to imgbb and send via url-encoded
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

export default slander;
