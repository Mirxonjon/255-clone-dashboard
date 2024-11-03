export const convertTimeToSeconds = (timeString: string) => {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds;
};

export const formatSecondsToTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = (seconds % 60).toFixed(3);

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(6, "0")
    .slice(0, 2)}`;

  return formattedTime;
};

export const returnMothData = async (date: string) => {
  const mothName = [
    { name: 'Yanvar', days: '31' },
    { name: 'Fevral', days: '28' },
    { name: 'Mart', days: '31' },
    { name: 'Aprel', days: '30' },
    { name: 'May', days: '31' },
    { name: 'Iyun', days: '30' },
    { name: 'Iyul', days: '31' },
    { name: 'Avgust', days: '31' },
    { name: 'Sentabr', days: '30' },
    { name: 'Oktabr', days: '31' },
    { name: 'Noyabr', days: '30' },
    { name: 'Dekabr', days: '31' },
  ];

  const mothnumber = +date.split('.')[1] - 1;
  return mothName[mothnumber];
};

const month_return = {
  1: 31,
  2: 28,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

export const convertDate = (data: Date): string => {
  const a = JSON.stringify(data)
    .split('T')[0]
    .split('"')[1]
    .split('-')
    .reverse()
    .map((e) => Number(e));
  return `${a[0]}.${a[1]}.${a[2]}`;
};

export const completionDate = (startDate: Date, monthLimit: number): string => {
  const date = JSON.stringify(startDate)
    .split('T')[0]
    .split('"')[1]
    .split('-')
    .reverse()
    .map((e) => Number(e));

  date[1] += monthLimit;
  if (date[1] > 12) {
    date[1] -= 12;
    date[2] += 1;
  }
  if (month_return[date[1]] < date[0]) {
    date[0] -= month_return[date[1]];
    date[1] += 1;
  }
  if (date[1] > 12) {
    date[1] -= 12;
    date[2] += 1;
  }
  return date
    .map((e: number) => (`${e}`.length === 1 ? `0${e}` : String(e)))
    .join(' ');
};

export const convertorDateToDay = (date: string): number => {
  const dateArr = date.split(' ');
  let sumDay = +dateArr[0];

  for (let i = 1; i <= +dateArr[1]; i++) {
    sumDay += month_return[i];
  }
  let day = sumDay + +dateArr[2] * 365;
  return day;
};

export const subtractTime = (fullDuration: string, pauseDuration: string) => {
  const fullDurationSeconds = parseTimeStringToSeconds(fullDuration);
  const pauseDurationSeconds = parseTimeStringToSeconds(pauseDuration);

  const resultSeconds = fullDurationSeconds - pauseDurationSeconds;

  const result = secondsToTimeFormat(resultSeconds);

  return result;
};

export const parseTimeStringToSeconds = (timeString: string) => {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return totalSeconds;
};

export const secondsToTimeFormat = (totalSeconds: number) => {
  // Sekundlardan soat, daqiqa va soniyalarni hisoblaymiz
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Formatga o'tkazib chiqamiz (2 raqamli formatda)
  const result = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

  return result;
};

export const padZero = (num: number) => {
  return num.toString().padStart(2, '0');
};

