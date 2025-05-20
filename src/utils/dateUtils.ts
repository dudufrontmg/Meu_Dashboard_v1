import { parseISO, isValid, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const parseExcelDate = (date: any): Date | null => {
  if (!date) return null;

  // Se for uma string, tenta parsear o formato brasileiro DD/MM/AAAA
  if (typeof date === 'string') {
    const parts = date.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês em JavaScript é 0-based
      const year = parseInt(parts[2], 10);
      
      const parsedDate = new Date(year, month, day);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
  }

  // Se for um número (data do Excel), converte
  if (typeof date === 'number') {
    // Ajuste para o sistema de data do Excel
    const excelEpoch = new Date(1899, 11, 30);
    const parsedDate = new Date(excelEpoch.getTime() + (date * 24 * 60 * 60 * 1000));
    
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  // Se todas as tentativas de parsing falharem, retorna null
  return null;
};

export const isDateInRange = (date: any, startDate: string | null, endDate: string | null): boolean => {
  if (!startDate && !endDate) return true;

  const parsedDate = parseExcelDate(date);
  if (!parsedDate) return false;

  const inicio = startDate ? startOfMonth(parseISO(startDate + '-01')) : null;
  const fim = endDate ? endOfMonth(parseISO(endDate + '-01')) : null;

  if (inicio && fim) {
    return isWithinInterval(parsedDate, { start: inicio, end: fim });
  } else if (inicio) {
    return parsedDate >= inicio;
  } else if (fim) {
    return parsedDate <= fim;
  }

  return true;
}