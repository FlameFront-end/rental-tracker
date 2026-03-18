import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BookingEntity } from '../../bookings/entities/booking.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'assets' })
export class AssetEntity {
  @ApiProperty({
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    example: 'Yamaha NMAX 2024',
    maxLength: 120,
  })
  @Column({
    type: 'varchar',
    length: 120,
  })
  name!: string;

  @ApiProperty()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany(() => BookingEntity, (booking) => booking.asset)
  bookings!: BookingEntity[];
}
