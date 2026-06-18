import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export const MAX_BATCH_SIZE = 200;

export class CollectRequestDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách URL đã validate & dedup ở client (document §4.1, §7).',
    example: ['https://www.facebook.com/some/posts/123', 'tiktok.com/@user/video/456'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_BATCH_SIZE)
  @IsString({ each: true })
  urls!: string[];
}
