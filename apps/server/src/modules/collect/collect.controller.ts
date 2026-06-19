import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CollectService } from './collect.service';
import { CollectRequestDto } from './dto/collect-request.dto';

@ApiTags('collect')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Post()
  @ApiOperation({
    summary: 'Nhận list URL → crawl → stream metric chuẩn hoá (NDJSON, mỗi dòng 1 event).',
    description:
      'NDJSON stream: mỗi URL crawl xong server đẩy ngay 1 dòng `{type:"result"}` → client cập nhật UI tức thì, không chờ cả batch. Mở đầu `{type:"start",total}`, kết thúc `{type:"done"}`.',
  })
  @ApiProduces('application/x-ndjson')
  @ApiOkResponse({ description: 'Stream NDJSON các CollectStreamEvent.' })
  async collect(@Body() body: CollectRequestDto, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no'); // tắt buffer reverse-proxy (nginx) để đẩy từng dòng
    res.flushHeaders?.();

    for await (const event of this.collectService.collectStream(body.urls)) {
      res.write(`${JSON.stringify(event)}\n`);
    }
    res.end();
  }
}
