import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [    CacheModule.register()],
  controllers: [],
  providers: [EventsGateway],
})
export class EventModule {}
