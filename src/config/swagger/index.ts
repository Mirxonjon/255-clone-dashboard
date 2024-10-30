import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('LinCore project')
  .setVersion('1.0')
  .build();
