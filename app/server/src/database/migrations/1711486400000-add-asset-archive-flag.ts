import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetArchiveFlag1711486400000 implements MigrationInterface {
  name = 'AddAssetArchiveFlag1711486400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD COLUMN "is_archived" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
      DROP COLUMN "is_archived"
    `);
  }
}
