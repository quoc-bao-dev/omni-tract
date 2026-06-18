import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollectResponse } from '@omni/sdk';
import { CollectService } from './collect.service';
import { CollectRequestDto } from './dto/collect-request.dto';

@ApiTags('collect')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Post()
  @ApiOperation({
    summary: 'Nhận list URL → crawl → trả metric chuẩn hoá (per-URL, partial failure).',
  })
  @ApiOkResponse({ description: 'Kết quả theo từng URL (CollectResponse).' })
  collect(@Body() body: CollectRequestDto): Promise<CollectResponse> {
    return this.collectService.collect(body.urls);
  }
}
