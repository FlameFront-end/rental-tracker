import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AssetEntity } from '../../assets/entities/asset.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty({
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '123456789',
  })
  @Column({
    name: 'telegram_id',
    type: 'bigint',
    unique: true,
  })
  telegramId!: string;

  @ApiProperty()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @OneToMany(() => AssetEntity, (asset) => asset.user)
  assets!: AssetEntity[];
}
