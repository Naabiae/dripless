import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tradeId!: string;
}

export class LockEscrowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  txHash!: string;
}
