import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable, Req } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { GroupsEntity } from 'src/entities/group.entity';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { dataGroupEntity } from 'src/entities/dataGroup.entity';
import { convertDate } from 'src/utils/converters';
import { agentslockEntity } from 'src/entities/agentslock.entity';
import {
  fetchStatisticByGroup,
  operatorsWhere,
} from 'src/utils/fetchEvery1hour';
import { Telegraf } from 'telegraf';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Groupqueue } from 'src/utils/fetcheEvery5s';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  readonly #_cache: Cache;

  async handleConnection(client: Socket) {
    // return 'Connected to the server.'
    this.server.emit('connected', 'Connected to the server.');
    const findgroups = await GroupsEntity.find();
    this.server.emit('groups', findgroups);
  }

  public bot: Telegraf;

  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    // this.bot = new Telegraf('641117002:AAExqB0wV0xyy8cw18rjVOEGHPLe3cGsgU8'); //ozgartirrilgan
    this.bot = new Telegraf(process.env.BOT_TOKEN); //serverga qoyishdan oldin yoq
    this.#_cache = cache;
  }

  @Cron('59 23 * * *')
  fetchdata1() {;
    fetchStatisticByGroup();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleAgentsAtTheMomentAddCash() {
    const operatorsWhereatThemoment: any = await Promise.all(
      await operatorsWhere(this.bot, this.#_cache),
    );

    await this.#_cache.set('lockOperators', operatorsWhereatThemoment, 3600000);
  }

  @SubscribeMessage('agentsLockAtTheMoment')
  async handleAgentsAtTheMoment() {
    const data = await this.#_cache.get('lockOperators');

    return data;
  }

  @SubscribeMessage('agentsLock')
  async handleAgents(@MessageBody('id') id: number) {
    return await agentslockEntity.find({
      order: {
        create_data: 'DESC',
      },
    });
  }
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleAgentsAtTheMomentGroupQueue() {
    const GroupQueuesAtThemoment: any = await Promise.all(await Groupqueue());

    await this.#_cache.set('GroupQueue', GroupQueuesAtThemoment, 3600000);
  }

  @SubscribeMessage('data')
  async handleData1(@MessageBody('id') id: number) {
    const data = await this.#_cache.get('GroupQueue');
    return data;
  }
  @SubscribeMessage('dataoldMethod')
  async handleData(@MessageBody('id') id: number) {
    id = 2012;

    const findGroups = await GroupsEntity.find({
      relations: {
        servic: true,
      },
    });
    const resultPromises = findGroups.map(async (e) => {
      const sampleHeaders = {
        'user-agent': 'sampleTest',
        'Content-Type': 'text/xml;charset=UTF-8',
        soapAction: 'urn:ct/ctPortType/PrCtAgentsRequest',
      };
      const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
        <soapenv:Header/>
        <soapenv:Body>
           <urn:PrCtGroupContent2>
              <!--Optional:-->
              <urn:PrCtGroupContent2Req>
                 <urn:serviceId>${e.servic.service_id}</urn:serviceId>
                 <urn:groupId>${e.group_id}</urn:groupId>
              </urn:PrCtGroupContent2Req>
           </urn:PrCtGroupContent2>
        </soapenv:Body>
     </soapenv:Envelope>`;

      const { data } = await axios.post(
        'http://192.168.42.92:8081/ct?wsdl',
        xml,
        { headers: sampleHeaders },
      );
      const convertedData = await parseStringPromise(data);

      const callQueuesize =
        convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
          'ct:PrCtGroupContent2Resp'
        ][0]['ct:callQueueSize'][0];
      const agents =
        convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
          'ct:PrCtGroupContent2Resp'
        ][0]['ct:agents'][0]['ct:TmCtAgentInGroup2'];
      let busy = 0;
      let free = 0;
      let block = 0;

      for (let i = 0; i < agents?.length; i++) {
        if (
          agents[i]['ct:agentState'] == 3 ||
          (agents[i]['ct:agentState'] == 4 && agents[i]['ct:cgpn'] != '')
        ) {
          busy++;
        } else if (agents[i]['ct:agentState'] == 2) {
          free++;
        } else if (agents[i]['ct:agentState'] == 4) {
          block++;
        }
      }

      return {
        goup_id: e.group_id,
        title: e.title,
        queue: callQueuesize,
        online: busy + free + block,
        in_job: busy,
        free: free,
        locked: block,
      };
    });
    const results = await Promise.all(resultPromises);
    const sortedData = results?.sort((a, b) => +b.queue - +a.queue);

    return sortedData;
  }
  @SubscribeMessage('agentslockdate')
  async handleLockAgent(@MessageBody('id') id: number) {
    let pageNumber = 1;
    let pageSize = 50;
    const offset = (pageNumber - 1) * pageSize;

    const [results, total] = await agentslockEntity.findAndCount({
      order: {
        create_data: 'DESC',
      },
      skip: offset,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      results,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalItems: total,
      },
    };
  }
  @SubscribeMessage('statictik')
  async handleStatictikData(@MessageBody() data: string) {
    console.log(data);

    const findStatistik: any = await dataGroupEntity.find({
      order: {
        create_data: 'ASC',
      },
    });

    let sumAcceptedCallCount = 0;
    let sumPresentedCallCount = 0;
    let sumLostCallCount = 0;
    let sumStraggleCallCount = 0;
    let sumQueueDispatchedCallCoun = 0;
    let arrdate = [];
    let arrAcceptedCallCount = [];
    let arrPresentedCallCount = [];
    let arrLostCallCount = [];
    let arrStraggleCallCount = [];
    let arrQueueDispatchedCallCoun = [];
    let calcAcceptedCallCount = 0;
    let calcPresentedCallCount = 0;
    let calcLostCallCount = 0;
    let calcStraggleCallCount = 0;
    let calcQueueDispatchedCallCoun = 0;

    findStatistik.forEach((e) => {
      e.formdata = convertDate(e.create_data);

      sumAcceptedCallCount += +e.acceptedCallCount;
      sumPresentedCallCount += +e.presentedCallCount;
      sumLostCallCount += +e.lostCallCount;
      sumStraggleCallCount += +e.straggleCallCount;
      sumQueueDispatchedCallCoun += +e.queueDispatchedCallCoun;
    });

    findStatistik.forEach((e) => {
      if (!arrdate.includes(e.formdata)) {
        arrdate.push(e.formdata);
      }
    });

    arrdate.forEach((e) => {
      calcAcceptedCallCount = 0;
      calcPresentedCallCount = 0;
      calcLostCallCount = 0;
      calcStraggleCallCount = 0;
      calcQueueDispatchedCallCoun = 0;
      findStatistik.forEach((n) => {
        if (n.formdata == e) {
          calcAcceptedCallCount += +n?.acceptedCallCount;
          calcPresentedCallCount += +n?.presentedCallCount;
          calcLostCallCount += +n?.lostCallCount;
          calcStraggleCallCount += +n?.straggleCallCount;
          calcQueueDispatchedCallCoun += +n?.queueDispatchedCallCoun;
        }
      });
      arrAcceptedCallCount.push(calcAcceptedCallCount);
      arrPresentedCallCount.push(calcPresentedCallCount);
      arrLostCallCount.push(calcLostCallCount);
      arrStraggleCallCount.push(calcStraggleCallCount);
      arrQueueDispatchedCallCoun.push(calcQueueDispatchedCallCoun);
    });

    return {
      arrdate,
      arrAcceptedCallCount,
      arrPresentedCallCount,
      arrLostCallCount,
      arrStraggleCallCount,
      arrQueueDispatchedCallCoun,
      sumAcceptedCallCount,
      sumPresentedCallCount,
      sumLostCallCount,
      sumStraggleCallCount,
      sumQueueDispatchedCallCoun,
    };
  }

  @SubscribeMessage('statictikGroup')
  async handleStatictikDataGroup(@MessageBody() data: { group_id: string }) {
    const finGroupStatic: any = await dataGroupEntity.find({
      where: {
        group_id: data.group_id,
      },
      order: {
        create_data: 'ASC',
      },
    });

    let sumAcceptedCallCount = 0;
    let sumPresentedCallCount = 0;
    let sumLostCallCount = 0;
    let sumStraggleCallCount = 0;
    let sumQueueDispatchedCallCoun = 0;
    let arrdate = [];
    let arrAcceptedCallCount = [];
    let arrPresentedCallCount = [];
    let arrLostCallCount = [];
    let arrStraggleCallCount = [];
    let arrQueueDispatchedCallCoun = [];
    let calcAcceptedCallCount = 0;
    let calcPresentedCallCount = 0;
    let calcLostCallCount = 0;
    let calcStraggleCallCount = 0;
    let calcQueueDispatchedCallCoun = 0;

    finGroupStatic.forEach((e) => {
      e.formdata = convertDate(e.create_data);

      sumAcceptedCallCount += +e.acceptedCallCount;
      sumPresentedCallCount += +e.presentedCallCount;
      sumLostCallCount += +e.lostCallCount;
      sumStraggleCallCount += +e.straggleCallCount;
      sumQueueDispatchedCallCoun += +e.queueDispatchedCallCoun;
    });

    finGroupStatic.forEach((e) => {
      if (!arrdate.includes(e.formdata)) {
        arrdate.push(e.formdata);
      }
    });

    arrdate.forEach((e) => {
      calcAcceptedCallCount = 0;
      calcPresentedCallCount = 0;
      calcLostCallCount = 0;
      calcStraggleCallCount = 0;
      calcQueueDispatchedCallCoun = 0;
      finGroupStatic.forEach((n) => {
        if (n.formdata == e) {
          calcAcceptedCallCount += +n?.acceptedCallCount;
          calcPresentedCallCount += +n?.presentedCallCount;
          calcLostCallCount += +n?.lostCallCount;
          calcStraggleCallCount += +n?.straggleCallCount;
          calcQueueDispatchedCallCoun += +n?.queueDispatchedCallCoun;
        }
      });
      arrAcceptedCallCount.push(calcAcceptedCallCount);
      arrPresentedCallCount.push(calcPresentedCallCount);
      arrLostCallCount.push(calcLostCallCount);
      arrStraggleCallCount.push(calcStraggleCallCount);
      arrQueueDispatchedCallCoun.push(calcQueueDispatchedCallCoun);
    });

    // let sum1AcceptedCallCount = 6058;
    // let sum1PresentedCallCount = 4350;
    // let sum1LostCallCount = 980;
    // let sum1StraggleCallCount = 400;
    // let sum1QueueDispatchedCallCoun = 800;
    // finGroupStatic.reverse();
    // finGroupStatic.push({ a: 'b' });
    // let ar1 = [];
    // let obj = {};
    // const calc1 = finGroupStatic.forEach((e) => {
    //   //  e.create_data = convertDate(e.create_data)
    //   if (!arrdate.includes(e.formdata)) {
    //     arrAcceptedCallCount.push(sum1AcceptedCallCount);
    //     arrPresentedCallCount.push(sum1PresentedCallCount);
    //     arrLostCallCount.push(sum1LostCallCount);
    //     arrStraggleCallCount.push(sum1StraggleCallCount);
    //     arrQueueDispatchedCallCoun.push(sum1QueueDispatchedCallCoun);

    //     arrdate.push(e.formdata);
    //     sum1AcceptedCallCount = 0;
    //     sum1PresentedCallCount = 0;
    //     sum1LostCallCount = 0;
    //     sum1StraggleCallCount = 0;
    //     sum1QueueDispatchedCallCoun = 0;
    //   }
    //   // console.log( e.formdata , arrdate.at(-1));

    //   if (e.formdata == arrdate.at(-1)) {
    //     sum1AcceptedCallCount += +e.acceptedCallCount;
    //     sum1PresentedCallCount += +e.presentedCallCount;
    //     sum1LostCallCount += +e.lostCallCount;
    //     sum1StraggleCallCount += +e.straggleCallCount;
    //     sum1QueueDispatchedCallCoun += +e.queueDispatchedCallCoun;
    //   }
    // });

    return {
      arrdate,
      arrAcceptedCallCount,
      arrPresentedCallCount,
      arrLostCallCount,
      arrStraggleCallCount,
      arrQueueDispatchedCallCoun,
      sumAcceptedCallCount,
      sumPresentedCallCount,
      sumLostCallCount,
      sumStraggleCallCount,
      sumQueueDispatchedCallCoun,
    };
    // console.log(finGroupStatic);
  }

  handleDisconnect(client: Socket) {
    clearInterval('aa');
  }

  //   @Timeout(5000)
  async fetchData() {
    const data = await fetchDataFromAPI();
    this.server.emit('data', 'eshmat okadan');
  }

  @Interval(5000)
  fetchDataInterval() {
    this.fetchData();
  }
}

async function fetchDataFromAPI() {
  // API dan ma'lumotlarni olish logikasi
  return 'okk'; // fetchData ning API dan ma'lumotlarni olish logikasini o'zgartiring.
}

// async function fetchData() {
//     return 'okk'
//   // API dan ma'lumotlarni olish uchun kerakli kodni yozing
// }
