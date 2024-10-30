import axios from 'axios';
import { dataGroupEntity } from 'src/entities/dataGroup.entity';
import { GroupsEntity } from 'src/entities/group.entity';
import { parseStringPromise } from 'xml2js';
import { convertTimeToSeconds, formatSecondsToTime } from './converters';
import { agentsDataStateEntity } from 'src/entities/agentsDataState.entity';
import { getBotToken } from 'nestjs-telegraf';
import { agentslockEntity } from 'src/entities/agentslock.entity';
import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

export const fetchStatisticByGroup = async () => {
  const findGroups = await GroupsEntity.find();

  findGroups.forEach(async (e) => {
    const sampleHeaders = {
      'user-agent': 'sampleTest',
      'Content-Type': 'text/xml;charset=UTF-8',
      soapAction: 'urn:ct/ctPortType/PrCtGetStatisticTlvRequest',
    };
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
      <soapenv:Header/>
      <soapenv:Body>
         <urn:PrCtGetStatisticTlv>
            <!--Optional:-->
            <urn:PrCtGetStatisticTlvReq>
               <urn:ObjectType>2</urn:ObjectType>
               <!--Zero or more repetitions:-->
               <urn:listID>${e.group_id}</urn:listID>
            </urn:PrCtGetStatisticTlvReq>
         </urn:PrCtGetStatisticTlv>
      </soapenv:Body>
   </soapenv:Envelope>`;

    const { data } = await axios.post(
      'http://192.168.42.92:8081/ct?wsdl',
      xml,
      { headers: sampleHeaders },
    );
    const convertedData = await parseStringPromise(data);

    const acceptedCallCount =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][1]['ct:strValue'][0];
    const presentedCallCount =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][2]['ct:strValue'][0];
    const lostCallCount =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][15]['ct:strValue'][0];
    const straggleCallCount =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][17]['ct:strValue'][0];
    const averageTimeBeforeConnect =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][26]['ct:strValue'][0];
    const averageCallDuration =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][27]['ct:strValue'][0];
    const queueDispatchedCallCoun =
      convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ct:PrCtGetStatisticTlvResp'
      ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0]['ct:listValue'][0][
        'ct:TmStatDataValueTlv'
      ][39]['ct:strValue'][0];

    dataGroupEntity.save({
      group_id: e.group_id,
      acceptedCallCount,
      presentedCallCount,
      lostCallCount,
      straggleCallCount,
      averageTimeBeforeConnect,
      averageCallDuration,
      queueDispatchedCallCoun,
    });
  });
};

export const operatorsWhere = async (bot: Telegraf<Context<Update>> ): Promise<any[]> => {
  let arrBlockAgents = [];
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
             <urn:serviceId>3305</urn:serviceId>
             <urn:groupId>4395</urn:groupId>
          </urn:PrCtGroupContent2Req>
       </urn:PrCtGroupContent2>
    </soapenv:Body>
 </soapenv:Envelope>`;

  const { data } = await axios.post('http://192.168.42.92:8081/ct?wsdl', xml, {
    headers: sampleHeaders,
  });
  const convertedData = await parseStringPromise(data);

  const agents =
    convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
      'ct:PrCtGroupContent2Resp'
    ][0]['ct:agents'][0]['ct:TmCtAgentInGroup2'];

  for (let i = 0; i < agents.length; i++) {
    if (agents[i]['ct:ip'][0]) {
      const arr = ['2', '4', '3', '6'];
      const findAgent = await agentsDataStateEntity.findOneBy({
        id: agents[i]['ct:id'][0],
      });
      if (arr.includes(agents[i]['ct:lockCause'][0]) && findAgent) {
        if (
          findAgent.lockCause == agents[i]['ct:lockCause'][0] &&
          agents[i]['ct:agentStateDuration'][0] > 600
        ) {
          
          if (!findAgent.IsSupervazer) {
          const findAgentlock = await agentslockEntity.find({
            where : {
              id: agents[i]['ct:id'][0],

            },
            order : {
              create_data :  'DESC'
            }
          });
          let data :any = {}
        
          
  if(findAgent.TgMsgId == 'null' && agents[i]['ct:agentStateDuration'][0] < 720 ) {
    data =  await  bot.telegram.sendMessage('-1002031426090' , ` ${findAgent.lastName} ${findAgent.firstName} ${findAgent.secondName} превысил 10-минутный перерыв`)
     await agentsDataStateEntity.update(
      { id: findAgent.id },
      { TgMsgSentTime : agents[i]['ct:agentStateDuration'][0],
      TgMsgId: data.message_id 
    },
    );
 
    
 }else if(agents[i]['ct:agentStateDuration'][0] - +findAgent.TgMsgSentTime > 300 ) {
    data = await bot.telegram.sendMessage('-1002031426090', `Оператор ${findAgent.lastName} ${findAgent.firstName} ${findAgent.secondName} всё ещё не включился на линию! ${formatSecondsToTime(agents[i]['ct:agentStateDuration'][0])}`, {reply_to_message_id : +findAgent.TgMsgId})
    await agentsDataStateEntity.update(
      { id: findAgent.id },
      { TgMsgSentTime : agents[i]['ct:agentStateDuration'][0],
      TgMsgId: data.message_id 
    },
    );
  }
          
          if (findAgentlock[0] && !findAgent.addToblockTable) {
            await  agentslockEntity.update(
              { agent_id: findAgentlock[0].agent_id },
              {
                agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              },
            );
            arrBlockAgents.push({
              ...findAgentlock[0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
            });
          } else {
            
           await agentslockEntity.save({
              id: agents[i]['ct:id'][0],
              firstName: agents[i]['ct:firstName'][0],
              login: Number(agents[i]['ct:login'][0]),
              lastName: agents[i]['ct:lastName'][0],
              secondName: agents[i]['ct:secondName'][0],
              agentState: agents[i]['ct:agentState'][0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lastAgentStateDuration: findAgent.lastAgentStateDuration,
              lockCause: agents[i]['ct:lockCause'][0],
              lastLockCause: findAgent.lastLockCause,
              banInfo : 'time'
            });

            arrBlockAgents.push({
              id: agents[i]['ct:id'][0],
              firstName: agents[i]['ct:firstName'][0],
              login: agents[i]['ct:login'][0],
              lastName: agents[i]['ct:lastName'][0],
              secondName: agents[i]['ct:secondName'][0],
              agentState: agents[i]['ct:agentState'][0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lastAgentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lockCause: agents[i]['ct:lockCause'][0],
              lastLockCause: findAgent.lastLockCause,
              banInfo: 'time'
            });
          }
          
          await agentsDataStateEntity.update(
            { id: findAgent.id },
            { agentStateDuration: agents[i]['ct:agentStateDuration'][0],
            addToblockTable :false,
          },
          );
          }

        } else if (
          findAgent.lockCause != agents[i]['ct:lockCause'][0] &&
          arr.includes(`${findAgent.lockCause}`)
        ) {
          if (!findAgent.IsSupervazer) {
            
            const findAgentlock = await agentslockEntity.find({
              where : {
                id: agents[i]['ct:id'][0],
              },
              order : {
                create_data :  'DESC'
              }
            });
          if (findAgentlock[0] && !findAgent.addToblockTable) {
            await agentslockEntity.update(
              { agent_id : findAgentlock[0].agent_id },
              {
                agentState: agents[i]['ct:agentState'][0],
                agentStateDuration: agents[i]['ct:agentStateDuration'][0],
                lastAgentStateDuration: findAgent.IsBlockToBlock == false ?  findAgent.agentStateDuration : findAgentlock[0].lastAgentStateDuration ,
                lockCause: agents[i]['ct:lockCause'][0],
                lastLockCause: findAgent.lockCause,
              },
            );

            arrBlockAgents.push({
              ...findAgentlock[0],
              agentState: agents[i]['ct:agentState'][0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lastAgentStateDuration: findAgent.IsBlockToBlock == false ?  findAgent.agentStateDuration : findAgentlock[0].lastAgentStateDuration ,
              lockCause: agents[i]['ct:lockCause'][0],
              lastLockCause: findAgent.lockCause,
            });
          } else {
            await agentslockEntity.save({
              id: agents[i]['ct:id'][0],
              firstName: agents[i]['ct:firstName'][0],
              login: Number(agents[i]['ct:login'][0]),
              lastName: agents[i]['ct:lastName'][0],
              secondName: agents[i]['ct:secondName'][0],
              agentState: agents[i]['ct:agentState'][0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lastAgentStateDuration: findAgent.agentStateDuration,
              lockCause: agents[i]['ct:lockCause'][0],
              lastLockCause: findAgent.lockCause,
              banInfo : 'block'
            });

            arrBlockAgents.push({
              id: agents[i]['ct:id'][0],
              firstName: agents[i]['ct:firstName'][0],
              login: agents[i]['ct:login'][0],
              lastName: agents[i]['ct:lastName'][0],
              secondName: agents[i]['ct:secondName'][0],
              agentState: agents[i]['ct:agentState'][0],
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              lastAgentStateDuration: findAgent.agentStateDuration,
              lockCause: agents[i]['ct:lockCause'][0],
              lastLockCause: findAgent.lockCause,
	      banInfo : 'block'
            });
            const message = {
              '2': '🚬',
              '3': '👑',
              '4': '💻',
              '6': '🏃',
              '7': '🧑‍🎓',
            }
              await bot.telegram.sendMessage('-1002031426090', `   ${findAgent.lastName} ${findAgent.firstName} ${findAgent.secondName} поменял статус ${ message[findAgent.lockCause]} на ${ message[agents[i]['ct:lockCause'][0]]}`)
          }
         await agentsDataStateEntity.update(
            { id: findAgent.id },
            {
              agentState: agents[i]['ct:agentState'][0],
              lastAgentStateDuration: findAgent.IsBlockToBlock == false ?  findAgent.agentStateDuration : findAgent.lastAgentStateDuration ,
              agentStateDuration: agents[i]['ct:agentStateDuration'][0],
              IsBlockToBlock : true,
              addToblockTable :false
            },
          );
        }
        } else {
          await agentsDataStateEntity.update(
            { id: findAgent.id },
            {
            agentState: agents[i]['ct:agentState'][0],
            agentStateDuration: agents[i]['ct:agentStateDuration'][0],
            lastAgentStateDuration: findAgent.IsOnlineToBlock == true ?  findAgent.agentStateDuration : findAgent.lastAgentStateDuration ,
            lockCause: agents[i]['ct:lockCause'][0],
            lastLockCause: findAgent.IsOnlineToBlock == true ?  findAgent.lockCause : findAgent.lastLockCause,
            IsOnlineToBlock : false,
            IsBlockToBlock : true,
            addToblockTable :true,
            TgMsgId : 'null'
            
            },
          );
        
      
        }
      } else if (findAgent) {
        await agentsDataStateEntity.update(
          { id: findAgent.id },
          {
            agentState: agents[i]['ct:agentState'][0],
            agentStateDuration: agents[i]['ct:agentStateDuration'][0],
            lastAgentStateDuration: findAgent.IsBlockToBlock == true ?  findAgent.agentStateDuration : findAgent.lastAgentStateDuration ,
            lockCause: agents[i]['ct:lockCause'][0],
            lastLockCause: findAgent.IsBlockToBlock == true ?  findAgent.lockCause : findAgent.lastLockCause,
            IsBlockToBlock : false,
            IsOnlineToBlock :true ,
            addToblockTable :true,
            TgMsgId: 'null'
          },
        );
      } else {
        await agentsDataStateEntity.save({
          id: agents[i]['ct:id'][0],
          firstName: agents[i]['ct:firstName'][0],
          login: agents[i]['ct:login'][0],
          lastName: agents[i]['ct:lastName'][0],
          secondName: agents[i]['ct:secondName'][0],
          agentState: agents[i]['ct:agentState'][0],
          agentStateDuration: agents[i]['ct:agentStateDuration'][0],
          IsSupervazer : false ,
          lockCause: agents[i]['ct:lockCause'][0],
        });
      }
    
    }
  }

  return arrBlockAgents;
};

