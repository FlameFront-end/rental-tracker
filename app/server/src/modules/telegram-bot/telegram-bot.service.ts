import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Markup, Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf<Context> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
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

    await Promise.allSettled([
      bot.launch(),
      this.setMyCommands(bot),
      this.setChatMenuButton(bot),
    ]);
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
