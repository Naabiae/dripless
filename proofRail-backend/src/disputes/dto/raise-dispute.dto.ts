import { IsString, IsNotEmpty, IsObject, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeResolution } from '@prisma/client';

export class RaiseDisputeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tradeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class SubmitEvidenceDto {
  @ApiProperty()
  @IsObject()
  evidence!: any;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeResolution })
  @IsEnum(DisputeResolution)
  resolution!: DisputeResolution;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
