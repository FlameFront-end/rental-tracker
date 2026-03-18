import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNotificationPreferences1711137600000
  implements MigrationInterface
{
  public readonly name = 'AddUserNotificationPreferences1711137600000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
			ALTER TABLE users
			ADD COLUMN notification_reminder_today_enabled boolean NOT NULL DEFAULT true,
			ADD COLUMN notification_reminder_tomorrow_enabled boolean NOT NULL DEFAULT true
		`);
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(`
			ALTER TABLE users
			DROP COLUMN IF EXISTS notification_reminder_tomorrow_enabled,
			DROP COLUMN IF EXISTS notification_reminder_today_enabled
		`);
  }
}
