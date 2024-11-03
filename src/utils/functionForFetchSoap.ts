import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export const fetchGetagentStatistic = async (id: number) => {
  // 2751
  //     const sampleHeaders = {
  //     'user-agent': 'sampleTest',
  //     'Content-Type': 'text/xml;charset=UTF-8',
  //     soapAction: 'urn:ct/ctPortType/PrCtAgentsRequest',
  //   };

  const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
  <soapenv:Header/>
  <soapenv:Body>
     <urn:PrCtGetStatisticTlv>
        <!--Optional:-->
        <urn:PrCtGetStatisticTlvReq>
           <urn:ObjectType>1</urn:ObjectType>
          <urn:listID>${id}</urn:listID>

        </urn:PrCtGetStatisticTlvReq>
     </urn:PrCtGetStatisticTlv>
  </soapenv:Body>
</soapenv:Envelope>`;

  const { data } = await axios.post(
    'http://192.168.42.92:8081/ct?wsdl',
    xml,
    // { headers: sampleHeaders },
  );
  //192.168.42.92:8081/ct?wsdl
  //   console.log("So'rovdan keyin 5 soniya kutamiz...");
  //   await waitFor5Seconds();

  // Keyingi kodlar bu joyga yoziladi, 5 soniya o'tib ketdi

  //   console.log("5 soniya o'tib ketdi. Keyingi qadamlar...");

  const convertedData = await parseStringPromise(data);

  

  if (
    !convertedData['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
      'ct:PrCtGetStatisticTlvResp'
    ][0]['ct:listStatistic'][0]
  ) {
    // console.log(id ,'nullllllll');

    return {
      LastLoginTime: 'not login',
      FulDuration: '00:00:00',
      PauseDuration: '00:00:00',
    };
  } else {
    const LastLoginTime: string = await convertedData['SOAP-ENV:Envelope'][
      'SOAP-ENV:Body'
    ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
      'ct:TmCtStatisticTlv'
    ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][11]['ct:strValue'][0];
    const FulDuration: string = await convertedData['SOAP-ENV:Envelope'][
      'SOAP-ENV:Body'
    ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
      'ct:TmCtStatisticTlv'
    ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][12]['ct:strValue'][0];
    const PauseDuration: string = await convertedData['SOAP-ENV:Envelope'][
      'SOAP-ENV:Body'
    ][0]['ct:PrCtGetStatisticTlvResp'][0]['ct:listStatistic'][0][
      'ct:TmCtStatisticTlv'
    ][0]['ct:listValue'][0]['ct:TmStatDataValueTlv'][17]['ct:strValue'][0];


    return {
      LastLoginTime,
      FulDuration,
      PauseDuration,
    };
  }
};


