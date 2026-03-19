import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAdminFields1711400000000 implements MigrationInterface {
  name = 'AddUserAdminFields1711400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "telegram_username" character varying(64)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "is_admin"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "telegram_username"
    `);
  }
}
