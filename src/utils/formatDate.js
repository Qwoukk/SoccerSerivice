const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatMatchDate(utcString) {
  const date = new Date(utcString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: userTimeZone 
  });
}

export function formatMatchTime(utcString) {
  const date = new Date(utcString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimeZone
  });
}
export function getUTCRangeFromLocalDates(localDateFrom, localDateTo) {
  const fromDate = new Date(localDateFrom);
  const toDate = new Date(localDateTo);
  const startOfDayLocal = new Date(fromDate);
  startOfDayLocal.setHours(0, 0, 0, 0);
  
  const endOfDayLocal = new Date(toDate);
  endOfDayLocal.setHours(23, 59, 59, 999);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const utcFromStr = formatter.format(startOfDayLocal);
  const utcToStr = formatter.format(endOfDayLocal);

  return {
    dateFrom: utcFromStr,
    dateTo: utcToStr
  };
}

export function isMatchInLocalDateRange(matchUtcDate, localDateFrom, localDateTo) {
  const matchDate = new Date(matchUtcDate);
  const matchLocalDateStr = matchDate.toLocaleDateString('fr-CA', {
    timeZone: userTimeZone
  });
  
  return matchLocalDateStr >= localDateFrom && matchLocalDateStr <= localDateTo;
}