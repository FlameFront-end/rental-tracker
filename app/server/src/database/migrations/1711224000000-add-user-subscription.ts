import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSubscription1711224000000
  implements MigrationInterface
{
  public readonly name = 'AddUserSubscription1711224000000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "CREATE TYPE user_subscription_status_enum AS ENUM ('none', 'trial', 'active')",
    );
    await queryRunner.query(`
			ALTER TABLE users
			ADD COLUMN subscription_status user_subscription_status_enum NOT NULL DEFAULT 'none',
			ADD COLUMN subscription_ends_at timestamptz NULL
		`);
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(`
			ALTER TABLE users
			DROP COLUMN IF EXISTS subscription_ends_at,
			DROP COLUMN IF EXISTS subscription_status
		`);
    await queryRunner.query('DROP TYPE IF EXISTS user_subscription_status_enum');
  }
}
