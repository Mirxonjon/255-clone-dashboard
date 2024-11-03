import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersEntity } from 'src/entities/users.entity';
import { AdminEntity } from 'src/entities/admin.entity';
import { ServicesEntity } from 'src/entities/service.entity';
import { ServicedateEntity } from 'src/entities/servicedata.entity';
import { GroupsEntity } from 'src/entities/group.entity';
import { dataServiceGroupEntity } from 'src/entities/dataServiceGroup';
import { dataGroupEntity } from 'src/entities/dataGroup.entity';
import { agentsDataStateEntity } from 'src/entities/agentsDataState.entity';
import { agentslockEntity } from 'src/entities/agentslock.entity';
import { AgentDateEntity } from 'src/entities/agentdate.entity';
import { GraphMonthEntity } from 'src/entities/graphMoth';
import { GraphDaysEntity } from 'src/entities/graphDays';
import { ComputersEntity } from 'src/entities/computer.entity';
import { AgentControlGraphEntity } from 'src/entities/agentsControlGrafigh.entity';

dotenv.config();

export const connectDb: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  password: String(process.env.DB_PASSWORD),
  username: process.env.DB_USERNAME,
  database: process.env.DATABASE,
  entities: [
    UsersEntity,
    AdminEntity,
    ServicesEntity,
    ServicedateEntity,
    GroupsEntity,
    dataServiceGroupEntity,
    dataGroupEntity,
    agentsDataStateEntity,
    agentslockEntity,
    AgentDateEntity,
    GraphMonthEntity,
    GraphDaysEntity,
    ComputersEntity,
    AgentControlGraphEntity,
  ],
  autoLoadEntities: true,
  synchronize: true,
};
