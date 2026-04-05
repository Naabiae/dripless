import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Chain, PaymentMethod } from '@prisma/client';

export class CreateTradeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @ApiProperty({ enum: Chain })
  @IsEnum(Chain)
  chain!: Chain;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assetSymbol!: string;

  @ApiProperty()
  @IsNumber()
  assetAmount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fiatCurrency!: string;

  @ApiProperty()
  @IsNumber()
  fiatAmount!: number;

  @ApiProperty()
  @IsNumber()
  fiatRate!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
