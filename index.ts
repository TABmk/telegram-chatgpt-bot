import { ChatGPT } from 'chatgpt-wrapper';
import { Bot, Context } from 'grammy';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      ChatGPT_API_KEY: string;
      ADMIN: string;
    }
  }
}

type DBdata = {
  admins: number[]
};

const adapter = new JSONFile<DBdata>('./db/db.json');
const defaultData: DBdata = {
  admins: [
    Number(process.env.ADMIN),
  ],
};
const db = new Low(adapter, defaultData);

const bot = new Bot(process.env.BOT_TOKEN);
const GPT = new ChatGPT({
  API_KEY: process.env.ChatGPT_API_KEY || '',
});

bot.catch((err) => {
  console.log(err);
});

const isAdmin = async (ctx: Context) => {
  await db.read();

  return ctx?.chat?.id === Number(process.env.ADMIN);
};

const adminCmd = bot.filter(isAdmin);

adminCmd.command('add', async (ctx: Context) => {
  db.data.admins.push(Number(ctx.match));

  await db.write();

  ctx.reply(JSON.stringify(db.data.admins));
});

adminCmd.command('remove', async (ctx: Context) => {
  db.data.admins = db.data.admins.filter((id) => id !== Number(ctx.match));

  await db.write();

  ctx.reply(JSON.stringify(db.data.admins));
});

adminCmd.command('list', async (ctx: Context) => {
  ctx.reply(JSON.stringify(db.data.admins));
});

bot
  .chatType('private')
  .on(':text')
  .filter(
    async (ctx) => {
      await db.read();

      return db.data.admins.includes(ctx.chat.id);
    },
    async (ctx) => {
      try {
        await ctx.reply('Generating...');
        const res = await GPT.send(ctx.message.text);

        ctx.reply(res.choices[0].message.content || 'Try again');
      } catch (error) {
        console.log(error);
      }
    },
  );

bot
  .on(':text', (ctx) => {
    ctx.reply(`
Check out:
- https://github.com/TABmk/chatgpt-wrapper
- https://github.com/TABmk/telegram-chatgpt-bot
`);
  });

bot.start();
