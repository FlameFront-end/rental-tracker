import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAssetType1710964800000 implements MigrationInterface {
  public readonly name = 'RemoveAssetType1710964800000';

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX IF EXISTS idx_assets_user_type');
    await queryRunner.query('ALTER TABLE assets DROP COLUMN IF EXISTS type');
    await queryRunner.query('DROP TYPE IF EXISTS asset_type_enum');
  }

  public async down(queryRunner: QueryRunner) {
    await queryRunner.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum') THEN CREATE TYPE asset_type_enum AS ENUM ('bike'); END IF; END $$",
    );
    await queryRunner.query(
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS type asset_type_enum NOT NULL DEFAULT 'bike'",
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_assets_user_type ON assets (user_id, type)',
    );
  }
}
