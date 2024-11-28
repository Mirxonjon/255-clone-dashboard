import axios from 'axios';
import { log } from 'console';
import { DataEntity } from 'src/entities/data.entity';
import { parseStringPromise } from 'xml2js';

// export const fetchGetagentStatistic = async (id: number) => {
//   try {
//     // 2751
//     //     const sampleHeaders = {
//     //     'user-agent': 'sampleTest',
//     //     'Content-Type': 'text/xml;charset=UTF-8',
//     //     soapAction: 'urn:ct/ctPortType/PrCtAgentsRequest',
//     //   };

//     const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
//   <soapenv:Header/>
//   <soapenv:Body>
//      <urn:PrCtGetStatisticTlv>
//         <!--Optional:-->
//         <urn:PrCtGetStatisticTlvReq>
//            <urn:ObjectType>1</urn:ObjectType>
//           <urn:listID>${id}</urn:listID>

//         </urn:PrCtGetStatisticTlvReq>
//      </urn:PrCtGetStatisticTlv>
//   </soapenv:Body>
// </soapenv:Envelope>`;

//     const { data } = await axios.post(
//       'http://192.168.42.92:8081/ct?wsdl',
//       xml,
//       // { headers: sampleHeaders },
//     );
//     //192.168.42.92:8081/ct?wsdl
//     //   console.log("So'rovdan keyin 5 soniya kutamiz...");
//     //   await waitFor5Seconds();

//     // Keyingi kodlar bu joyga yoziladi, 5 soniya o'tib ketdi

//     // console.log(data);

//     const convertedData = await parseStringPromise(data);

//     console.log(
//       convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
//         'ct:PrCtGetStatisticTlvResp'
//       ][0]['ct:listStatistic'][0]['ct:TmCtStatisticTlv'][0],
//     );

//     if (
//       !convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
//         'ct:PrCtGetStatisticTlvResp'
//       ][0]['ct:listStatistic'][0]
//     ) {
//       return {
//         LastLoginTime: 'not login',
//         FulDuration: '00:00:00',
//         PauseDuration: '00:00:00',
//       };
//     } else {
//       const LastLoginTime: string = await convertedData['SOAP-ENV:Envelope'][
//         'SOAP-ENV:Body'
//       ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
//         'ct:TmCtStatisticTlv'
//       ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][11]['ct:strValue'][0];
//       const FulDuration: string = await convertedData['SOAP-ENV:Envelope'][
//         'SOAP-ENV:Body'
//       ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
//         'ct:TmCtStatisticTlv'
//       ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][12]['ct:strValue'][0];
//       const PauseDuration: string = await convertedData['SOAP-ENV:Envelope'][
//         'SOAP-ENV:Body'
//       ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
//         'ct:TmCtStatisticTlv'
//       ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][17]['ct:strValue'][0];

//       return {
//         LastLoginTime,
//         FulDuration,
//         PauseDuration,
//       };
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

export const fetchGetagentStatistic = async (id: number) => {
  try {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
      <soapenv:Header/>
      <soapenv:Body>
         <urn:PrCtGetStatisticTlv>
            <urn:PrCtGetStatisticTlvReq>
               <urn:ObjectType>1</urn:ObjectType>
               <urn:listID>${id}</urn:listID>
            </urn:PrCtGetStatisticTlvReq>
         </urn:PrCtGetStatisticTlv>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const { data } = await axios.post('http://192.168.42.93:8081/ct?wsdl', xml);

    const convertedData = await parseStringPromise(data);

    const body = convertedData['SOAP-ENV:Envelope']?.['SOAP-ENV:Body']?.[0];
    const statisticResponse = body?.['ct:PrCtGetStatisticTlvResp']?.[0];
    const listStatistic = statisticResponse?.['ct:listStatistic']?.[0];
    const statisticTlv = listStatistic?.['ct:TmCtStatisticTlv']?.[0];
    const listValues1 =
      statisticTlv['ct:listValue'][0]['ct:TmStatDataValueTlv'] || [];
    const LastLoginTime1 = listValues1[11]?.['ct:strValue']?.[0];
    const FulDuration1 = listValues1[12]?.['ct:strValue']?.[0];
    const PauseDuration1 = listValues1[17]?.['ct:strValue']?.[0];
    const listParam = statisticResponse?.['ct:listParam'] || [];
    // const statistics = listParam.map((paramName, index) => {
    //   const valueData = listValues1[index] || {};
    //   return {
    //     name: paramName,
    //     strValue: valueData['ct:strValue']?.[0] || null,
    //     nParameter: valueData['ct:nParameter']?.[0] || null,
    //   };
    // });

    // console.log(statistics);

    await DataEntity.createQueryBuilder()
      .insert()
      .into(DataEntity)
      .values({
        dataSaup: body,
        id_agent: id.toString(),
        lastLoginTime: LastLoginTime1,
        FulDuration: FulDuration1,
        PauseDuration: PauseDuration1,
      })
      .execute()
      .catch((e) => {
        console.log(e.message);
      });

    console.log(LastLoginTime1, FulDuration1, PauseDuration1, 'STATISTIK');

    if (!statisticTlv || !statisticTlv['ct:listValue']) {
      return {
        LastLoginTime: 'not login',
        FulDuration: '00:00:00',
        PauseDuration: '00:00:00',
      };
    }

    const listValues = statisticTlv['ct:listValue'][0]['ct:TmStatDataValueTlv'];
    const LastLoginTime = listValues[11]?.['ct:strValue']?.[0];
    const FulDuration = listValues[12]?.['ct:strValue']?.[0];
    const PauseDuration = listValues[17]?.['ct:strValue']?.[0];

    return {
      LastLoginTime,
      FulDuration,
      PauseDuration,
    };
  } catch (error) {
    console.error('Error fetching agent statistics:', error.message);
    return {
      LastLoginTime: 'error',
      FulDuration: 'error',
      PauseDuration: 'error',
    };
  }
};

export const fetchGetagentStatistic1 = async (agentId: number) => {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; 

    // API so'rovi
    const response = await axios.get(
      `http://192.168.42.101:9090/agent?agentId=${agentId}&startDate=${startDate}`,
    );
    console.log(response.data, startDate);

    const data = response.data;

    if (data.result !== 'success') {
      return {
        LastLoginDate: 'not login',
        LastLoginTime: 'not login',
        FulDuration: '00:00:00',
        PauseDuration: '00:00:00',
      };
    }

    const { loginTime, duration } = data;

    await DataEntity.createQueryBuilder()
      .insert()
      .into(DataEntity)
      .values({
        dataSaup: response.data,
        id_agent: agentId.toString(),
        lastLoginTime: loginTime,
        FulDuration: duration,
      })
      .execute()
      .catch((e) => {
        console.log(e.message);
      });
    const LastLoginDate = loginTime ? extractDate(loginTime) : 'not login';
    const LastLoginTime = loginTime ? extractTime(loginTime) : 'not login';
    const FulDuration = duration?.fullDuration
      ? convertSecondsToTime(duration.fullDuration)
      : '00:00:00';
    const PauseDuration = duration?.pauseDuration
      ? convertSecondsToTime(duration.pauseDuration)
      : '00:00:00';

    return {
      LastLoginDate,
      LastLoginTime,
      FulDuration,
      PauseDuration,
    };
  } catch (error) {
    console.error('Error fetching agent statistics:', error.message);
    return {
      LastLoginDate: 'error',
      LastLoginTime: 'error',
      FulDuration: 'error',
      PauseDuration: 'error',
    };
  }
};

// Helper function to extract date from loginTime (YYYY-MM-DD format)
const extractDate = (loginTime: string): string => {
  return loginTime.split(' ')[0]; // Splits at the space and returns the date part
};

// Helper function to extract time from loginTime (HH:mm:ss format)
const extractTime = (loginTime: string): string => {
  return loginTime.split(' ')[1]; // Splits at the space and returns the time part
};

// Helper function to convert seconds to HH:mm:ss format
const convertSecondsToTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0',
  )}:${String(secs).padStart(2, '0')}`;
};
