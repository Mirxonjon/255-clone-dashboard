import { v4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { extname, join, resolve } from 'path';
import { google } from 'googleapis';

const keyFilenameSheet = resolve(process.cwd(), 'src', 'utils', 'google.json');

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilenameSheet, // Path to your service account key file.
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Scope for Google Sheets API.
});

const projectId = 'telecom-398714';
const keyFilename = resolve(process.cwd(), 'src', 'utils', 'key.json');
const storage = new Storage({
  projectId,
  keyFilename,
});
const bucket = storage.bucket('telecom-storege_pic');

export const googleCloud = (file: any | any[]) => {
  const a: any[] = [];
  a.push(file);
  const imageLink = join(v4() + extname(a[0]?.originalname));
  const blob = bucket.file(imageLink);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    console.log(err);
  });

  blobStream.end(a[0]?.buffer);
  return imageLink;
};

export const readSheets = async (
  // sheetId: string,
  rangeName: string,
  rangeCut: string,
) => {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.SHEETID;
  const range = `${rangeName}!${rangeCut}`; // Specifies the range to read.

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values; // Extracts the rows from the response.
    return rows; // Returns the rows.
  } catch (error) {
    console.error('error sheet', error); // Logs errors.
  }
};



export const readSheet = async (rangeCut: string) => {
  console.log(process.env.SHEETID);
  
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.SHEETID;
  const range = 'grafik!A1:AH'; // Specifies the range to read.

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values; // Extracts the rows from the response.
    return rows; // Returns the rows.
  } catch (error) {
    console.error('error', error); // Logs errors.
  }
};



export const writeToSheet = async (
  list: string,
  rangeCut: string,
  values: any[][],
) => {
  const sheets = google.sheets({ version: 'v4', auth }); // Creates a Sheets API client instance.
  const spreadsheetId = process.env.SHEETID;
  const range = `${list}!${rangeCut}`; // The range in the sheet where data will be written.
  const valueInputOption = 'USER_ENTERED'; // How input data should be interpreted.

  const requestBody = { values }; // The data to be written.

  try {
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      requestBody,
    });
    return res.data; // Returns the response from the Sheets API.
  } catch (error) {
    console.error('error', error); // Logs errors.
  }
};

export const insertRowsAtTop = async (list, numRows = 10 ) => {
  const sheets = google.sheets({ version: 'v4', auth }); // Create Sheets API client instance.
  const spreadsheetId = process.env.SHEETID;

  try {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: list, // The ID of the sheet where rows will be inserted.
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: numRows, // Insert 'numRows' rows starting from the top.
              },
              inheritFromBefore: false,
            },
          },
          
        ],
      
      },
    });
    return res.data; // Returns the response from the Sheets API.
  } catch (error) {
    console.error('Error inserting rows:', error);
  }
};

