import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710878400000 implements MigrationInterface {
  public readonly name = 'InitialSchema1710878400000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(
      "CREATE TYPE booking_status_enum AS ENUM ('paid', 'pending')",
    );
    await queryRunner.query(`
			CREATE TABLE users (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				telegram_id bigint NOT NULL,
				created_at timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT uq_users_telegram_id UNIQUE (telegram_id)
			)
		`);
    await queryRunner.query(`
			CREATE TABLE assets (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id uuid NOT NULL,
				name varchar(120) NOT NULL,
				created_at timestamptz NOT NULL DEFAULT now(),
				updated_at timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT fk_assets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);
    await queryRunner.query(`
			CREATE TABLE bookings (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				asset_id uuid NOT NULL,
				client_name varchar(120) NOT NULL,
				start_date date NOT NULL,
				end_date date NOT NULL,
				price numeric(12,2) NOT NULL DEFAULT 0,
				status booking_status_enum NOT NULL DEFAULT 'pending',
				created_at timestamptz NOT NULL DEFAULT now(),
				updated_at timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT fk_bookings_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
				CONSTRAINT ck_bookings_date_range CHECK (start_date <= end_date)
			)
		`);
    await queryRunner.query(
      'CREATE INDEX idx_assets_user_id ON assets (user_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookings_asset_id ON bookings (asset_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookings_end_date ON bookings (end_date)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookings_status ON bookings (status)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookings_asset_dates ON bookings (asset_id, start_date, end_date)',
    );
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX IF EXISTS idx_bookings_asset_dates');
    await queryRunner.query('DROP INDEX IF EXISTS idx_bookings_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_bookings_end_date');
    await queryRunner.query('DROP INDEX IF EXISTS idx_bookings_asset_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_assets_user_id');
    await queryRunner.query('DROP TABLE IF EXISTS bookings');
    await queryRunner.query('DROP TABLE IF EXISTS assets');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TYPE IF EXISTS booking_status_enum');
  }
}
