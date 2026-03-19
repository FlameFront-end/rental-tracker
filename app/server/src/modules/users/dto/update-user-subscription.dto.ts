import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const USER_SUBSCRIPTION_ADMIN_ACTIONS = [
  'grant_month',
  'grant_trial',
  'clear',
] as const;

export type UserSubscriptionAdminAction =
  (typeof USER_SUBSCRIPTION_ADMIN_ACTIONS)[number];

export class UpdateUserSubscriptionDto {
  @ApiProperty({
    enum: USER_SUBSCRIPTION_ADMIN_ACTIONS,
    example: 'grant_month',
  })
  @IsIn(USER_SUBSCRIPTION_ADMIN_ACTIONS)
  action!: UserSubscriptionAdminAction;
}
