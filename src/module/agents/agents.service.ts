import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { AgentDateEntity } from 'src/entities/agentdate.entity';
import { agentsDataStateEntity } from 'src/entities/agentsDataState.entity';
import { agentslockEntity } from 'src/entities/agentslock.entity';
import { ComputersEntity } from 'src/entities/computer.entity';
import { GraphDaysEntity } from 'src/entities/graphDays';
import { GraphMonthEntity } from 'src/entities/graphMoth';
import { GroupsEntity } from 'src/entities/group.entity';
import { ServicesEntity } from 'src/entities/service.entity';
import {
  ControlAgentGraph,
  ControlAgentGraphNB,
} from 'src/utils/agentControlfunctions';
import { returnMothData } from 'src/utils/converters';
import { readSheets } from 'src/utils/google_cloud';
import { Like } from 'typeorm';

@Injectable()
export class AgentsService {
  readonly #_cache: Cache;
  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    //ozgartirrilgan
    // this.bot = new Telegraf('5994786340:AAHQOpj10D8Bi0XhgQpYD14hDoHogp3Q0z8'); //serverga qoyishdan oldin yoq
    this.#_cache = cache;
  }

  async findAllAgents() {
    const findBlockAgents = await agentsDataStateEntity.find({
      order: {
        create_data: 'DESC',
      },
    });

    return findBlockAgents;
  }

  async findAll(pageNumber = 1, pageSize = 10) {
    const offset = (pageNumber - 1) * pageSize;

    const [results, total] = await agentslockEntity.findAndCount({
      order: {
        create_data: 'DESC',
      },
      skip: offset,
      take: pageSize,
    });

    const findBlocks = await agentslockEntity.find({
      where: {
        banInfo: 'block',
      },
    });
    const findTime = await agentslockEntity.find({
      where: {
        banInfo: 'time',
      },
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: {
        results,
        findBlocks: findBlocks.length,
        findTime: findTime.length,
      },
      pagination: {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalItems: total,
      },
    };
  }
  async filterAll(name: string, operator_number: string, status: string) {
    const filteragents = await agentslockEntity
      .find({
        where: {
          lastName: name == 'null' ? null : Like(`%${name}%`),
          login:
            operator_number == 'null' ? null : (Number(operator_number) as any),
          banInfo: status == 'null' ? null : status,
        },
        order: {
          create_data: 'DESC',
        },
      })
      .catch(() => {
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      });

    return filteragents;
  }
  async createService(body: { service_id: string }) {
    await ServicesEntity.createQueryBuilder()
      .insert()
      .into(ServicesEntity)
      .values({
        service_id: body.service_id,
      })
      .execute()
      .catch((e) => {
        console.log(e);
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      });
  }

  async createGroup(body: {
    service_id: string;
    group_id: string;
    name: string;
    title: string;
  }) {
    const findService = await ServicesEntity.findOneBy({ id: body.service_id });

    if (!findService) {
      throw new HttpException('Not Found Service', HttpStatus.BAD_REQUEST);
    }
    await GroupsEntity.createQueryBuilder()
      .insert()
      .into(GroupsEntity)
      .values({
        name: body.name,
        title: body.title,
        group_id: body.group_id,
        servic: body.service_id as any,
      })
      .execute()
      .catch((e) => {
        console.log(e);
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      });
  }

  async updateAgent(id: string, body: { status: boolean }) {
    const findAgent = await agentsDataStateEntity
      .findOne({
        where: {
          id: id,
        },
      })
      .catch(() => {
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      });

    if (findAgent) {
      await agentsDataStateEntity
        .createQueryBuilder()
        .update(agentsDataStateEntity)
        .set({
          IsSupervazer: body.status,
        })
        .where({ id })
        .execute()
        .catch(() => {
          throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
        });
    }
  }
  // @Cron('1 * * * * *')

  @Cron('0 0 20 * * *')
  async writeNewGraphlastMonth() {
    const now = new Date();
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    if (now.getDate() === lastDay) {
      const cutRanges = 'A2:AK500';

      // const sheetId: string = '1BF7Z9CTKdL-RvBwzZTcB4gvOqoviX6fUwHIBmSlG_ow';
      const rangeName: string = '255';
      const sheets = await readSheets(rangeName, cutRanges);

      for (const e of sheets) {
        if (e[1] == '229' || e[1] == '255' || e[1] == '1009') {
          const findAgent: AgentDateEntity = await AgentDateEntity.findOne({
            where: {
              id_login: e[4],
            },
            relations: {
              months: {
                days: true,
              },
            },
          });

          if (findAgent) {
            const updateAgent = await AgentDateEntity.createQueryBuilder()
              .update(AgentDateEntity)
              .set({ service_name: e[1], id_login: e[4], name: e[3], id: e[5] })
              .where('agent_id = :id', { id: findAgent.agent_id })
              .returning(['agent_id'])
              .execute();

            if (updateAgent) {
              const firstday = e[6].split('/')[0];

              const findMonth = await GraphMonthEntity.findOne({
                where: {
                  year: firstday.split('.')[2],
                  month_number: firstday.split('.')[1],
                  agent_id: updateAgent.raw[0]?.agent_id,
                },
              });

              if (findMonth) {
                const mothData = await returnMothData(firstday);

                const updateMoth = await GraphMonthEntity.createQueryBuilder()
                  .update(GraphMonthEntity)
                  .set({
                    year: firstday.split('.')[2],
                    month_number: +firstday.split('.')[1],
                    month_name: mothData.name,
                    month_days_count: mothData.days,
                    agent_id: updateAgent.raw[0].agent_id,
                  })
                  .where('id = :id', { id: findMonth.id })
                  .returning(['id'])
                  .execute()
                  .catch((e) => console.log(e));

                if (updateMoth) {
                  for (let i = 6; i < e.length; i++) {
                    const dataDay = e[i].split('/');
                    // console.log(dataDay);

                    const typesGraph = [
                      'DAM',
                      'Н',
                      'К',
                      'Б',
                      'О',
                      'Р',
                      'П',
                      'А',
                      'У',
                    ];
                    const typesTime = [
                      '10-19',
                      '07-16',
                      '08-17',
                      '09-18',
                      '11-20',
                      '13-22',
                      '15-24',
                      '17-02',
                      '07-15',
                      '08-16',
                      '09-17',
                      '08-18',
                      '18-08',
                      '14-23',
                      '18-09',
                      '09-18',
                    ];
                    const typesSmen = ['08-20', '20-08'];
                    // console.log(updateMoth,'updateMothdan');
                    // console.log('okkk' ,dataDay[0] , findMonth?.id , findAgent.agent_id);

                    const findDay = await GraphDaysEntity.findOne({
                      where: {
                        the_date: dataDay[0],
                        month_id: {
                          id: updateMoth?.raw[0]?.id, // `month_id` uchun to'g'ridan-to'g'ri qiymatni ko'rsating ,
                          // agent_id : {
                          //   agent_id: updateAgent.raw[0].agent_id
                          // }
                          //  agent_id: findAgent.agent_id as any
                        },
                      },
                      relations: {
                        month_id: {
                          agent_id: true,
                        },
                      },
                    }).catch((e) => console.log(e));
                    let formatDate = new Date(
                      +dataDay[0]?.split('.')[2],
                      +dataDay[0]?.split('.')[1] - 1,
                      +dataDay[0]?.split('.')[0],
                    );

                    if (findDay) {
                      if (typesGraph.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: dataDay[1],
                            work_day: +dataDay[0].split('.')[0],
                            work_time: null,
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: dataDay[1],
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      } else if (typesTime.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'day',
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      } else if (typesSmen.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'smen',
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      }
                    } else {
                      if (typesGraph.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: dataDay[1],
                            work_day: +dataDay[0].split('.')[0],
                            work_time: null,
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: dataDay[1],
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      } else if (typesTime.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'day',
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      } else if (typesSmen.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'smen',
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      }
                    }
                  }
                }
              } else {
                const mothData = await returnMothData(firstday);

                const newMoth = await GraphMonthEntity.createQueryBuilder()
                  .insert()
                  .into(GraphMonthEntity)
                  .values({
                    year: firstday.split('.')[2],
                    month_number: +firstday.split('.')[1],
                    month_name: mothData?.name,
                    month_days_count: mothData?.days,
                    agent_id: updateAgent.raw[0].agent_id,
                  })
                  .returning(['id'])
                  .execute()
                  .catch((e) => {
                    throw new HttpException(
                      'Bad Request',
                      HttpStatus.BAD_REQUEST,
                    );
                  });

                if (newMoth) {
                  for (let i = 6; i < e.length; i++) {
                    const dataDay = e[i].split('/');
                    let formatDate = new Date(
                      +dataDay[0]?.split('.')[2],
                      +dataDay[0]?.split('.')[1] - 1,
                      +dataDay[0]?.split('.')[0],
                    );

                    const typesGraph = [
                      'DAM',
                      'Н',
                      'К',
                      'Б',
                      'О',
                      'Р',
                      'П',
                      'А',
                      'У',
                    ];
                    const typesTime = [
                      '10-19',
                      '07-16',
                      '08-17',
                      '09-18',
                      '11-20',
                      '13-22',
                      '15-24',
                      '17-02',
                      '07-15',
                      '08-16',
                      '09-17',
                      '08-18',
                      '18-08',
                      '14-23',
                      '18-09',
                      '09-18',
                    ];
                    const typesSmen = ['08-20', '20-08'];

                    if (typesGraph.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: dataDay[1],
                          work_day: +dataDay[0].split('.')[0],
                          work_time: null,
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: dataDay[1],
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    } else if (typesTime.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: 'W',
                          work_day: +dataDay[0].split('.')[0],
                          work_time: dataDay[1],
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: 'day',
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    } else if (typesSmen.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: 'W',
                          work_day: +dataDay[0].split('.')[0],
                          work_time: dataDay[1],
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: 'smen',
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    }
                  }
                }
              }
            }
          } else {
            // agent else

            const newAgent = await AgentDateEntity.createQueryBuilder()
              .insert()
              .into(AgentDateEntity)
              .values({
                service_name: e[1],
                name: e[3],
                id_login: e[4],
                id: e[5],
              })
              .returning(['agent_id'])
              .execute()
              .catch((e) => {
                throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
              });

            if (newAgent) {
              const firstday = e[6].split('/')[0];

              const mothData = await returnMothData(firstday);
              const newMoth = await GraphMonthEntity.createQueryBuilder()
                .insert()
                .into(GraphMonthEntity)
                .values({
                  year: firstday.split('.')[2],
                  month_number: +firstday.split('.')[1],
                  month_name: mothData.name,
                  month_days_count: mothData.days,
                  agent_id: newAgent.raw[0].agent_id,
                })
                .returning(['id'])
                .execute()
                .catch((e) => {
                  throw new HttpException(
                    'Bad Request',
                    HttpStatus.BAD_REQUEST,
                  );
                });

              if (newMoth) {
                for (let i = 6; i < e.length; i++) {
                  const dataDay = e[i].split('/');
                  let formatDate = new Date(
                    +dataDay[0]?.split('.')[2],
                    +dataDay[0]?.split('.')[1] - 1,
                    +dataDay[0]?.split('.')[0],
                  );

                  const typesGraph = [
                    'DAM',
                    'Н',
                    'К',
                    'Б',
                    'О',
                    'Р',
                    'П',
                    'А',
                    'У',
                  ];
                  const typesTime = [
                    '10-19',
                    '07-16',
                    '08-17',
                    '09-18',
                    '11-20',
                    '13-22',
                    '15-24',
                    '17-02',
                    '07-15',
                    '08-16',
                    '09-17',
                    '08-18',
                    '18-08',
                    '14-23',
                    '18-09',
                    '09-18',
                  ];
                  const typesSmen = ['08-20', '20-08'];
                  // console.log(dataDay[1] , dataDay , firstday );
                  //

                  if (typesGraph.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: dataDay[1],
                        work_day: +dataDay[0].split('.')[0],
                        work_time: null,
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: dataDay[1],
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  } else if (typesTime.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: 'W',
                        work_day: +dataDay[0].split('.')[0],
                        work_time: dataDay[1],
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: 'day',
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  } else if (typesSmen.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: 'W',
                        work_day: +dataDay[0].split('.')[0],
                        work_time: dataDay[1],
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: 'smen',
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  }
                }
              }
            }
          }
        }
      }
      return true;
    }
  }

  async writeNewGraph() {

      const cutRanges = 'A2:AK500';

      // const sheetId: string = '1BF7Z9CTKdL-RvBwzZTcB4gvOqoviX6fUwHIBmSlG_ow';
      const rangeName: string = '255';
      const sheets = await readSheets(rangeName, cutRanges);

      for (const e of sheets) {
        if (e[1] == '229' || e[1] == '255' || e[1] == '1009') {
          const findAgent: AgentDateEntity = await AgentDateEntity.findOne({
            where: {
              id_login: e[4],
            },
            relations: {
              months: {
                days: true,
              },
            },
          });

          if (findAgent) {
            const updateAgent = await AgentDateEntity.createQueryBuilder()
              .update(AgentDateEntity)
              .set({ service_name: e[1], id_login: e[4], name: e[3], id: e[5] })
              .where('agent_id = :id', { id: findAgent.agent_id })
              .returning(['agent_id'])
              .execute();

            if (updateAgent) {
              const firstday = e[6].split('/')[0];

              const findMonth = await GraphMonthEntity.findOne({
                where: {
                  year: firstday.split('.')[2],
                  month_number: firstday.split('.')[1],
                  agent_id: updateAgent.raw[0]?.agent_id,
                },
              });

              if (findMonth) {
                const mothData = await returnMothData(firstday);

                const updateMoth = await GraphMonthEntity.createQueryBuilder()
                  .update(GraphMonthEntity)
                  .set({
                    year: firstday.split('.')[2],
                    month_number: +firstday.split('.')[1],
                    month_name: mothData.name,
                    month_days_count: mothData.days,
                    agent_id: updateAgent.raw[0].agent_id,
                  })
                  .where('id = :id', { id: findMonth.id })
                  .returning(['id'])
                  .execute()
                  .catch((e) => console.log(e));

                if (updateMoth) {
                  for (let i = 6; i < e.length; i++) {
                    const dataDay = e[i].split('/');
                    // console.log(dataDay);

                    const typesGraph = [
                      'DAM',
                      'Н',
                      'К',
                      'Б',
                      'О',
                      'Р',
                      'П',
                      'А',
                      'У',
                    ];
                    const typesTime = [
                      '10-19',
                      '07-16',
                      '08-17',
                      '09-18',
                      '11-20',
                      '13-22',
                      '15-24',
                      '17-02',
                      '07-15',
                      '08-16',
                      '09-17',
                      '08-18',
                      '18-08',
                      '14-23',
                      '18-09',
                      '09-18',
                    ];
                    const typesSmen = ['08-20', '20-08'];
                    // console.log(updateMoth,'updateMothdan');
                    // console.log('okkk' ,dataDay[0] , findMonth?.id , findAgent.agent_id);

                    const findDay = await GraphDaysEntity.findOne({
                      where: {
                        the_date: dataDay[0],
                        month_id: {
                          id: updateMoth?.raw[0]?.id, // `month_id` uchun to'g'ridan-to'g'ri qiymatni ko'rsating ,
                          // agent_id : {
                          //   agent_id: updateAgent.raw[0].agent_id
                          // }
                          //  agent_id: findAgent.agent_id as any
                        },
                      },
                      relations: {
                        month_id: {
                          agent_id: true,
                        },
                      },
                    }).catch((e) => console.log(e));
                    let formatDate = new Date(
                      +dataDay[0]?.split('.')[2],
                      +dataDay[0]?.split('.')[1] - 1,
                      +dataDay[0]?.split('.')[0],
                    );

                    if (findDay) {
                      if (typesGraph.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: dataDay[1],
                            work_day: +dataDay[0].split('.')[0],
                            work_time: null,
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: dataDay[1],
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      } else if (typesTime.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'day',
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      } else if (typesSmen.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .update(GraphDaysEntity)
                          .set({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'smen',
                            week_day_name: dataDay[2],
                          })
                          .where('id = :id', { id: findDay.id })
                          .returning(['id'])
                          .execute();
                      }
                    } else {
                      if (typesGraph.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: dataDay[1],
                            work_day: +dataDay[0].split('.')[0],
                            work_time: null,
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: dataDay[1],
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      } else if (typesTime.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'day',
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      } else if (typesSmen.includes(dataDay[1])) {
                        await GraphDaysEntity.createQueryBuilder()
                          .insert()
                          .into(GraphDaysEntity)
                          .values({
                            at_work: 'W',
                            work_day: +dataDay[0].split('.')[0],
                            work_time: dataDay[1],
                            the_date: dataDay[0],
                            the_day_Format_Date: formatDate,
                            work_type: 'smen',
                            week_day_name: dataDay[2],
                            month_id: findMonth[0].id,
                          })
                          .returning(['id'])
                          .execute()
                          .catch((e) => {
                            throw new HttpException(
                              'Bad Request',
                              HttpStatus.BAD_REQUEST,
                            );
                          });
                      }
                    }
                  }
                }
              } else {
                const mothData = await returnMothData(firstday);

                const newMoth = await GraphMonthEntity.createQueryBuilder()
                  .insert()
                  .into(GraphMonthEntity)
                  .values({
                    year: firstday.split('.')[2],
                    month_number: +firstday.split('.')[1],
                    month_name: mothData?.name,
                    month_days_count: mothData?.days,
                    agent_id: updateAgent.raw[0].agent_id,
                  })
                  .returning(['id'])
                  .execute()
                  .catch((e) => {
                    throw new HttpException(
                      'Bad Request',
                      HttpStatus.BAD_REQUEST,
                    );
                  });

                if (newMoth) {
                  for (let i = 6; i < e.length; i++) {
                    const dataDay = e[i].split('/');
                    let formatDate = new Date(
                      +dataDay[0]?.split('.')[2],
                      +dataDay[0]?.split('.')[1] - 1,
                      +dataDay[0]?.split('.')[0],
                    );

                    const typesGraph = [
                      'DAM',
                      'Н',
                      'К',
                      'Б',
                      'О',
                      'Р',
                      'П',
                      'А',
                      'У',
                    ];
                    const typesTime = [
                      '10-19',
                      '07-16',
                      '08-17',
                      '09-18',
                      '11-20',
                      '13-22',
                      '15-24',
                      '17-02',
                      '07-15',
                      '08-16',
                      '09-17',
                      '08-18',
                      '18-08',
                      '14-23',
                      '18-09',
                      '09-18',
                    ];
                    const typesSmen = ['08-20', '20-08'];

                    if (typesGraph.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: dataDay[1],
                          work_day: +dataDay[0].split('.')[0],
                          work_time: null,
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: dataDay[1],
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    } else if (typesTime.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: 'W',
                          work_day: +dataDay[0].split('.')[0],
                          work_time: dataDay[1],
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: 'day',
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    } else if (typesSmen.includes(dataDay[1])) {
                      await GraphDaysEntity.createQueryBuilder()
                        .insert()
                        .into(GraphDaysEntity)
                        .values({
                          at_work: 'W',
                          work_day: +dataDay[0].split('.')[0],
                          work_time: dataDay[1],
                          the_date: dataDay[0],
                          the_day_Format_Date: formatDate,
                          work_type: 'smen',
                          week_day_name: dataDay[2],
                          month_id: newMoth.raw[0].id,
                        })
                        .returning(['id'])
                        .execute()
                        .catch((e) => {
                          throw new HttpException(
                            'Bad Request',
                            HttpStatus.BAD_REQUEST,
                          );
                        });
                    }
                  }
                }
              }
            }
          } else {
            // agent else

            const newAgent = await AgentDateEntity.createQueryBuilder()
              .insert()
              .into(AgentDateEntity)
              .values({
                service_name: e[1],
                name: e[3],
                id_login: e[4],
                id: e[5],
              })
              .returning(['agent_id'])
              .execute()
              .catch((e) => {
                throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
              });

            if (newAgent) {
              const firstday = e[6].split('/')[0];

              const mothData = await returnMothData(firstday);
              const newMoth = await GraphMonthEntity.createQueryBuilder()
                .insert()
                .into(GraphMonthEntity)
                .values({
                  year: firstday.split('.')[2],
                  month_number: +firstday.split('.')[1],
                  month_name: mothData.name,
                  month_days_count: mothData.days,
                  agent_id: newAgent.raw[0].agent_id,
                })
                .returning(['id'])
                .execute()
                .catch((e) => {
                  throw new HttpException(
                    'Bad Request',
                    HttpStatus.BAD_REQUEST,
                  );
                });

              if (newMoth) {
                for (let i = 6; i < e.length; i++) {
                  const dataDay = e[i].split('/');
                  let formatDate = new Date(
                    +dataDay[0]?.split('.')[2],
                    +dataDay[0]?.split('.')[1] - 1,
                    +dataDay[0]?.split('.')[0],
                  );

                  const typesGraph = [
                    'DAM',
                    'Н',
                    'К',
                    'Б',
                    'О',
                    'Р',
                    'П',
                    'А',
                    'У',
                  ];
                  const typesTime = [
                    '10-19',
                    '07-16',
                    '08-17',
                    '09-18',
                    '11-20',
                    '13-22',
                    '15-24',
                    '17-02',
                    '07-15',
                    '08-16',
                    '09-17',
                    '08-18',
                    '18-08',
                    '14-23',
                    '18-09',
                    '09-18',
                  ];
                  const typesSmen = ['08-20', '20-08'];
                  // console.log(dataDay[1] , dataDay , firstday );
                  //

                  if (typesGraph.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: dataDay[1],
                        work_day: +dataDay[0].split('.')[0],
                        work_time: null,
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: dataDay[1],
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  } else if (typesTime.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: 'W',
                        work_day: +dataDay[0].split('.')[0],
                        work_time: dataDay[1],
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: 'day',
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  } else if (typesSmen.includes(dataDay[1])) {
                    await GraphDaysEntity.createQueryBuilder()
                      .insert()
                      .into(GraphDaysEntity)
                      .values({
                        at_work: 'W',
                        work_day: +dataDay[0].split('.')[0],
                        work_time: dataDay[1],
                        the_date: dataDay[0],
                        the_day_Format_Date: formatDate,
                        work_type: 'smen',
                        week_day_name: dataDay[2],
                        month_id: newMoth.raw[0].id,
                      })
                      .returning(['id'])
                      .execute()
                      .catch((e) => {
                        throw new HttpException(
                          'Bad Request',
                          HttpStatus.BAD_REQUEST,
                        );
                      });
                  }
                }
              }
            }
          }
        }
      
      return true;
    }
  }

  @Cron('1 * * * * *')
  async controlOperator() {
    const atDate = new Date();

    const theCurrentHour = atDate.getHours();
    const theCurrentMinut = atDate.getMinutes();
    const RequestTimeMinutes = [0, 10, 20,35];
    // const as = await ControlAgentGraphNB('20-08', theCurrentHour, this.#_cache);

    if (RequestTimeMinutes.includes(theCurrentMinut)) {
      if (theCurrentHour == 7) {
        const controlday = await ControlAgentGraphNB(
          '07-16',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }
      if (theCurrentHour == 8) {
        const controlday = await ControlAgentGraphNB(
          '08-17',
          theCurrentHour,
          this.#_cache,
        );
        const allDataday = Promise.all(controlday);
        const controlSmen = await ControlAgentGraphNB(
          '08-20',
          theCurrentHour,
          this.#_cache,
        );
        const allDataSmena = Promise.all(controlSmen);
      }
      if (theCurrentHour == 9) {
        const controlday = await ControlAgentGraphNB(
          '09-18',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }
      if (theCurrentHour == 11) {
        const controlday = await ControlAgentGraphNB(
          '11-20',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }
      if (theCurrentHour == 13) {
        const controlday = await ControlAgentGraphNB(
          '13-22',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }
      if (theCurrentHour == 15) {
        const controlday = await ControlAgentGraphNB(
          '15-24',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }
      if (theCurrentHour == 17) {
        const controlday = await ControlAgentGraphNB(
          '17-02',
          theCurrentHour,
          this.#_cache,
        );
        const allDataDay = Promise.all(controlday);
      }

      if (theCurrentHour == 20) {
        const controlSmen = await ControlAgentGraphNB(
          '20-08',
          theCurrentHour,
          this.#_cache,
        );
        const allDataSmena = Promise.all(controlSmen);
      }
    }
  }

  @Cron('0 0 1 * *')
  async writeIpAdress() {
    const cutRanges = 'A2:C999';
    // const sheetId: string = '1BF7Z9CTKdL-RvBwzZTcB4gvOqoviX6fUwHIBmSlG_ow';
    const rangeName: string = 'IP 255';
    const sheets = await readSheets(rangeName, cutRanges);

    for (const e of sheets) {
      console.log(e);
      if (e[0]) {
        const findComp = await ComputersEntity.findOne({
          where: {
            sheet_id: e[0],
          },
        });

        if (findComp) {
          await ComputersEntity.update(findComp.id, {
            sheet_id: e[0],
            ip_Adress: e[1],
            location: e[2],
          });
        } else {
          await ComputersEntity.createQueryBuilder()
            .insert()
            .into(ComputersEntity)
            .values({
              sheet_id: e[0],
              ip_Adress: e[1],
              location: e[2],
            })
            .execute()
            .catch((e) => {
              throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
            });
        }
      }
    }
  }
}
