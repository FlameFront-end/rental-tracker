import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

import { AssetEntity } from '../../assets/entities/asset.entity';
import { BookingStatus } from '../enums/booking-status.enum';

const numericTransformer = {
	from: (value: string | null) => (value === null ? null : Number(value)),
	to: (value: number) => value,
};

@Entity({ name: 'bookings' })
export class BookingEntity {
	@ApiProperty({
		format: 'uuid',
	})
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ApiProperty({
		format: 'uuid',
	})
	@Column({
		name: 'asset_id',
		type: 'uuid',
	})
	assetId!: string;

	@ApiProperty({
		example: 'John Smith',
		maxLength: 120,
	})
	@Column({
		name: 'client_name',
		type: 'varchar',
		length: 120,
	})
	clientName!: string;

	@ApiProperty({
		example: '2026-03-17',
	})
	@Column({
		name: 'start_date',
		type: 'date',
	})
	startDate!: string;

	@ApiProperty({
		example: '2026-03-20',
	})
	@Column({
		name: 'end_date',
		type: 'date',
	})
	endDate!: string;

	@ApiProperty({
		example: 150,
	})
	@Column({
		type: 'numeric',
		precision: 12,
		scale: 2,
		default: 0,
		transformer: numericTransformer,
	})
	price!: number;

	@ApiProperty({
		enum: BookingStatus,
		enumName: 'BookingStatus',
	})
	@Column({
		type: 'enum',
		enum: BookingStatus,
		default: BookingStatus.PENDING,
	})
	status!: BookingStatus;

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

	@ManyToOne(() => AssetEntity, (asset) => asset.bookings, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'asset_id' })
	asset!: AssetEntity;
}
