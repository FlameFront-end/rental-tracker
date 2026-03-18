import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Markup, Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf<Context> | null = null;

  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap() {
    void this.startBot();
  }

  private async startBot() {
    const botToken = this.getBotToken();

    if (!botToken) {
      return;
    }

    const bot = new Telegraf(botToken);

    bot.catch((error) => {
      const message =
        error instanceof Error ? error.message : 'Unknown Telegraf error.';

      this.logger.error(`Telegram bot error: ${message}`);
    });

    bot.start(async (ctx) => {
      const firstName = ctx.from?.first_name?.trim();
      const miniAppUrl = this.getMiniAppUrl();

      await ctx.reply(
        this.buildStartMessage(firstName, Boolean(miniAppUrl)),
        miniAppUrl
          ? Markup.inlineKeyboard([
              [Markup.button.webApp('Open Rental Tracker', miniAppUrl)],
            ])
          : undefined,
      );
    });

    this.bot = bot;

    const startupResults = await Promise.allSettled([
      bot.launch(),
      this.setMyCommands(bot),
      this.setChatMenuButton(bot),
    ]);

    const rejectedResults = startupResults.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (rejectedResults.length > 0) {
      for (const result of rejectedResults) {
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        this.logger.warn(`Telegram bot startup issue: ${message}`);
      }

      return;
    }

    this.logger.log('Telegram bot is running in polling mode.');
  }

  onModuleDestroy() {
    this.bot?.stop('module_destroy');
  }

  private buildStartMessage(firstName?: string, hasMiniAppUrl = false) {
    const greeting = firstName ? `Hi, ${firstName}.` : 'Hi.';

    const lines = [
      greeting,
      '',
      'Rental Tracker keeps your daily bike rentals clear and under control.',
      '',
      'Inside the app you can:',
      '• see what ends today and tomorrow',
      '• keep unpaid rentals in view',
      '• update bikes and bookings in a few taps',
    ];

    if (hasMiniAppUrl) {
      lines.push('', 'Tap the button below to open the app.');
    }

    return lines.join('\n');
  }

  private async setMyCommands(bot: Telegraf<Context>) {
    try {
      await bot.telegram.setMyCommands([
        {
          command: 'start',
          description: 'Open Rental Tracker',
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Telegram error.';

      this.logger.warn(`Failed to set Telegram commands: ${message}`);
    }
  }

  private async setChatMenuButton(bot: Telegraf<Context>) {
    const miniAppUrl = this.getMiniAppUrl();

    try {
      if (miniAppUrl && miniAppUrl.startsWith('https://')) {
        await bot.telegram.setChatMenuButton({
          menuButton: {
            type: 'web_app',
            text: 'Open app',
            web_app: {
              url: miniAppUrl,
            },
          },
        });

        return;
      }

      await bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'commands',
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Telegram error.';

      this.logger.warn(`Failed to set Telegram menu button: ${message}`);
    }
  }

  private getBotToken() {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
  }

  private getMiniAppUrl() {
    const appOrigin = this.configService.get<string>('APP_ORIGIN', '').trim();

    return appOrigin.startsWith('https://') ? appOrigin : '';
  }
}
