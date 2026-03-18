import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDeliveries1711051200000 implements MigrationInterface {
  public readonly name = 'AddNotificationDeliveries1711051200000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "CREATE TYPE notification_reminder_type_enum AS ENUM ('today', 'tomorrow')",
    );
    await queryRunner.query(
      "CREATE TYPE notification_delivery_status_enum AS ENUM ('processing', 'sent', 'failed')",
    );
    await queryRunner.query(`
			CREATE TABLE notification_deliveries (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				dedupe_key varchar(255) NOT NULL,
				user_id uuid NOT NULL,
				booking_id uuid NOT NULL,
				telegram_chat_id bigint NOT NULL,
				reminder_type notification_reminder_type_enum NOT NULL,
				target_date date NOT NULL,
				status notification_delivery_status_enum NOT NULL DEFAULT 'processing',
				attempt_count int NOT NULL DEFAULT 1,
				last_error text NULL,
				sent_at timestamptz NULL,
				created_at timestamptz NOT NULL DEFAULT now(),
				updated_at timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT fk_notification_deliveries_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
				CONSTRAINT fk_notification_deliveries_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
				CONSTRAINT uq_notification_deliveries_dedupe_key UNIQUE (dedupe_key)
			)
		`);
    await queryRunner.query(
      'CREATE INDEX idx_notification_deliveries_booking_id ON notification_deliveries (booking_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_notification_deliveries_status ON notification_deliveries (status)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_notification_deliveries_target_date ON notification_deliveries (target_date)',
    );
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_notification_deliveries_target_date',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_notification_deliveries_status',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_notification_deliveries_booking_id',
    );
    await queryRunner.query('DROP TABLE IF EXISTS notification_deliveries');
    await queryRunner.query(
      'DROP TYPE IF EXISTS notification_delivery_status_enum',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS notification_reminder_type_enum',
    );
  }
}
