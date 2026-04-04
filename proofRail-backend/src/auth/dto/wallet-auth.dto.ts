import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletNonceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address!: string;
}

export class WalletVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  signature!: string;
}
