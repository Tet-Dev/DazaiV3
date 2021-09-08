import { GuildCommand } from 'eris-boiler';
import tetGlobal from '../../tetGlobal';
import util from 'util';
import SQLHandler from '../../Handlers/SQLHandler';
export const evaluate = new GuildCommand({
  name: 'eval',
  description: 'Runs code. Very scary.',
  options: {

  },
  run: (async (bot, { member, msg }) => {
    if (!tetGlobal.Env.botMasters.includes(member?.id! || '')) {
      return 'You must be a Bot Master to run this command!';
    }
    let start = Date.now();
    async function evalWithContext(){
      return await eval(
        `(async ()=> {
          const {
            bot,
            msg,
            member,
            tetGlobal,
            SQLHandler,
          } = this;
          return ${msg.content.substring(msg.content.match(/.+eval /g)![0].length)}
        })()`
      );
    }
    const context = {
      bot,
      tetGlobal,
      member,
      msg,
      SQLHandler
    }
    let result = await evalWithContext.call(context);

    if (!result) return "Evaluation done!";
    if (typeof result !== "string" || typeof result !== "number" || typeof result !== "boolean") {
      result = util.inspect(result, { depth: 3 });
    }
    msg.channel.createMessage(`\`\`\`Eval Time: ${Date.now()-start}ms\`\`\``);
    if (`${result}`.length > 2000) {
      await msg.channel.createMessage("", {
        name: "result.js",
        file: Buffer.from(result)
      });
    } else
      return `\`\`\`js\n${result}\`\`\``;
    return 'done!'
  })
});
export default evaluate;