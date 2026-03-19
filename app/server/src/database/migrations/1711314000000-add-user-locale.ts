import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLocale1711314000000 implements MigrationInterface {
  public readonly name = 'AddUserLocale1711314000000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "CREATE TYPE user_locale_enum AS ENUM ('en', 'ru', 'id')",
    );
    await queryRunner.query(
      "ALTER TABLE users ADD COLUMN locale user_locale_enum NOT NULL DEFAULT 'en'",
    );
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS locale');
    await queryRunner.query('DROP TYPE IF EXISTS user_locale_enum');
  }
}
