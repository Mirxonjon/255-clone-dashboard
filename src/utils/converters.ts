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
