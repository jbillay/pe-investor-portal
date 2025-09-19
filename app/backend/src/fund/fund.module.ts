import { Module } from '@nestjs/common';
import { FundController } from './controllers/fund.controller';
import { FundService } from './services/fund.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FundController],
  providers: [FundService],
  exports: [FundService],
})
export class FundModule {}