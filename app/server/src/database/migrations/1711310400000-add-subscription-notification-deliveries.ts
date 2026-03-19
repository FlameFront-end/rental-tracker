import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionNotificationDeliveries1711310400000
  implements MigrationInterface
{
  public readonly name = 'AddSubscriptionNotificationDeliveries1711310400000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "CREATE TYPE subscription_notification_type_enum AS ENUM ('trial_expired', 'subscription_expired')",
    );
    await queryRunner.query(`
			CREATE TABLE subscription_notification_deliveries (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				dedupe_key varchar(255) NOT NULL,
				user_id uuid NOT NULL,
				telegram_chat_id bigint NOT NULL,
				notification_type subscription_notification_type_enum NOT NULL,
				subscription_ends_at timestamptz NOT NULL,
				status notification_delivery_status_enum NOT NULL DEFAULT 'processing',
				attempt_count int NOT NULL DEFAULT 1,
				last_error text NULL,
				sent_at timestamptz NULL,
				created_at timestamptz NOT NULL DEFAULT now(),
				updated_at timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT fk_subscription_notification_deliveries_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
				CONSTRAINT uq_subscription_notification_deliveries_dedupe_key UNIQUE (dedupe_key)
			)
		`);
    await queryRunner.query(
      'CREATE INDEX idx_subscription_notification_deliveries_status ON subscription_notification_deliveries (status)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_subscription_notification_deliveries_user_id ON subscription_notification_deliveries (user_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_subscription_notification_deliveries_subscription_ends_at ON subscription_notification_deliveries (subscription_ends_at)',
    );
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_subscription_notification_deliveries_subscription_ends_at',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_subscription_notification_deliveries_user_id',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_subscription_notification_deliveries_status',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS subscription_notification_deliveries',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS subscription_notification_type_enum',
    );
  }
}
