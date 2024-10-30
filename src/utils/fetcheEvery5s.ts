import axios from 'axios';
import { dataServiceGroupEntity } from 'src/entities/dataServiceGroup';
import { GroupsEntity } from 'src/entities/group.entity';
import { parseStringPromise } from 'xml2js';

export const fetchEvery5s = async () => {
  const findGroups = await GroupsEntity.find({
    relations: {
      servic: true,
    },
  });

  findGroups.forEach(async (e) => {
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

    for (let i = 0; i < agents.length; i++) {
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

    console.log(busy, free, block, 'raq', busy + free + block);
    // convertdata.busy = busy
    // convertdata.free = free
    // convertdata.block = block
    // convertdata.alloperators = busy + free + block

    dataServiceGroupEntity.save({
      goup_id: e.group_id,
      queue: callQueuesize,
      online: busy + free + block,
      in_job: busy,
      free: free,
      locked: block,
    });
  });
};

export const Groupqueue = async () => {
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

  const sortedData = results?.sort((a, b) => +b.queue - +a.queue)

  return sortedData;
}

