import { read, utils } from 'xlsx';
import { CauseData, CauseMetrics, CauseChartData, CauseTableData, CauseTableRow } from '../types';
import { extractProjectNumber } from './projectUtils';

export const loadCauseData = async (): Promise<{ causes: CauseData[], tableData: CauseTableRow[] }> => {
  try {
    const response = await fetch('/documents/Analise_e_Classificacao_das_Causas.xlsx');
    if (!response.ok) {
      throw new Error('Falha ao carregar arquivo de causas');
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer, { type: 'array' });
    
    // Ler a planilha CAUSAS
    const causesWorksheet = workbook.Sheets['CAUSAS'];
    const causesData = utils.sheet_to_json(causesWorksheet, { raw: true }) as CauseData[];

    // Ler a planilha TABELA_RESUMO
    const tableWorksheet = workbook.Sheets['TABELA_RESUMO'];
    const tableData = utils.sheet_to_json(tableWorksheet, { raw: true }) as CauseTableRow[];

    console.log('Dados carregados:', {
      causesData: causesData.slice(0, 3),
      tableData: tableData.slice(0, 3),
      totalCauses: causesData.length,
      totalTable: tableData.length
    });

    return { 
      causes: Array.isArray(causesData) ? causesData : [], 
      tableData: Array.isArray(tableData) ? tableData : [] 
    };
  } catch (error) {
    console.error('Erro ao carregar dados de causas:', error);
    return { causes: [], tableData: [] };
  }
};

export const getAvailableCauseStages = (causeData: CauseData[], projectCode: string): string[] => {
  if (!projectCode || !Array.isArray(causeData)) return [];

  const normalizedProjectCode = extractProjectNumber(projectCode);
  console.log('Buscando etapas para projeto:', normalizedProjectCode);

  const stages = causeData
    .filter(row => {
      const rowCodigos = row.CODIGOS?.toString().trim();
      if (!rowCodigos) return false;

      const normalizedRowCodigos = extractProjectNumber(rowCodigos);
      const projectMatch = normalizedRowCodigos === normalizedProjectCode;
      const hasCausa = row.CAUSA?.toString().toUpperCase().trim() === 'X';
      
      console.log('Verificando linha para etapas:', {
        rowCodigos,
        normalizedRowCodigos,
        projectMatch,
        hasCausa,
        etapa: row['ETAPA PROJETO']
      });

      return projectMatch && hasCausa;
    })
    .map(row => row['ETAPA PROJETO'])
    .filter((stage, index, self) => stage && self.indexOf(stage) === index)
    .sort();

  console.log('Etapas encontradas:', stages);
  return stages;
};

export const getCauseChartData = (
  causeData: CauseData[], 
  projectCode: string, 
  selectedStage: string
): CauseChartData[] => {
  if (!projectCode || !selectedStage || !Array.isArray(causeData)) {
    console.log('Dados inválidos para gerar gráfico:', { 
      projectCode, 
      selectedStage, 
      hasCauseData: Array.isArray(causeData),
      totalData: causeData.length 
    });
    return [];
  }

  const normalizedProjectCode = extractProjectNumber(projectCode);
  console.log('Buscando dados para projeto e etapa:', { normalizedProjectCode, selectedStage });

  const stageData = causeData.find(row => {
    const rowCodigos = row.CODIGOS?.toString().trim();
    if (!rowCodigos) return false;

    const normalizedRowCodigos = extractProjectNumber(rowCodigos);
    const projectMatch = normalizedRowCodigos === normalizedProjectCode;
    const stageMatch = row['ETAPA PROJETO']?.toString().trim() === selectedStage.trim();
    const hasCausa = row.CAUSA?.toString().toUpperCase().trim() === 'X';
    
    console.log('Verificando linha para gráfico:', {
      rowCodigos,
      normalizedRowCodigos,
      projectMatch,
      stageMatch,
      hasCausa,
      rowEtapa: row['ETAPA PROJETO']?.toString().trim(),
      selectedEtapa: selectedStage.trim()
    });

    return projectMatch && stageMatch && hasCausa;
  });

  if (!stageData) {
    console.log('Nenhum dado encontrado para o projeto e etapa. Dados da busca:', {
      projectCode,
      normalizedProjectCode,
      selectedStage,
      totalRegistros: causeData.length
    });
    return [];
  }

  console.log('Dados encontrados:', stageData);
  console.log('Chaves disponíveis:', Object.keys(stageData));

  const result: CauseChartData[] = [];
  
  // Converter DIF HORA TOT para número
  const difHoraTot = Number(stageData['DIF HORA TOT']) || 0;
  console.log('DIF HORA TOT:', difHoraTot);

  // Processar cada motivo utilizando as novas colunas HORA 1, HORA 2, ... HORA 5
  for (let i = 1; i <= 5; i++) {
    const horasKey = `HORA ${i}`;
    const causaKey = `CAUSA ${i}`;

    // Converte o valor da célula para número
    const horas = Number(stageData[horasKey]) || 0;
    // Calcula a variação conforme a nova regra: (HORA i / DIF HORA TOT) * 100
    const variacao = difHoraTot > 0 ? (horas / difHoraTot) * 100 : 0;
    const descricao = String(stageData[causaKey] || '').trim();

    console.log(`Processando motivo ${i}:`, { 
      horasKey,
      causaKey,
      horas,
      variacao,
      descricao,
      rawHorasValue: stageData[horasKey],
      rawDescValue: stageData[causaKey]
    });

    if (descricao && (horas > 0)) {
      result.push({
        name: descricao,
        horas,
        variacao
      });
    }
  }

  console.log('Dados processados para o gráfico:', result);
  return result;
};

export const getCauseTableData = (
  causeData: CauseData[],
  tableData: CauseTableRow[],
  projectCode: string,
  selectedStage: string
): CauseTableData[] => {
  if (!projectCode || !selectedStage || !Array.isArray(causeData) || !Array.isArray(tableData)) {
    console.log('Dados inválidos para gerar tabela:', { 
      projectCode, 
      selectedStage, 
      hasCauseData: Array.isArray(causeData),
      hasTableData: Array.isArray(tableData)
    });
    return [];
  }

  const normalizedProjectCode = extractProjectNumber(projectCode);
  console.log('Buscando dados da tabela para projeto e etapa:', { normalizedProjectCode, selectedStage });

  // Verificar se existe um registro com CAUSA = 'X' na planilha CAUSAS
  const stageData = causeData.find(row => {
    const rowCodigos = row.CODIGOS?.toString().trim();
    if (!rowCodigos) return false;

    const normalizedRowCodigos = extractProjectNumber(rowCodigos);
    const projectMatch = normalizedRowCodigos === normalizedProjectCode;
    const stageMatch = row['ETAPA PROJETO']?.toString().trim() === selectedStage.trim();
    const hasCausa = row.CAUSA?.toString().toUpperCase().trim() === 'X';

    console.log('Verificando linha para tabela:', {
      rowCodigos,
      normalizedRowCodigos,
      projectMatch,
      stageMatch,
      hasCausa,
      rowEtapa: row['ETAPA PROJETO']?.toString().trim(),
      selectedEtapa: selectedStage.trim()
    });

    return projectMatch && stageMatch && hasCausa;
  });

  if (!stageData) {
    console.log('Nenhum dado encontrado na planilha CAUSAS');
    return [];
  }

  // Filtrar dados da TABELA_RESUMO
  const filteredData = tableData
    .filter(row => {
      const rowCodigos = row.CODIGOS?.toString().trim();
      if (!rowCodigos) return false;

      const normalizedRowCodigos = extractProjectNumber(rowCodigos);
      const projectMatch = normalizedRowCodigos === normalizedProjectCode;
      const stageMatch = row['ETAPA PROJETO']?.toString().trim() === selectedStage.trim();

      console.log('Filtrando linha da TABELA_RESUMO:', {
        rowCodigos,
        normalizedRowCodigos,
        projectMatch,
        stageMatch,
        rowEtapa: row['ETAPA PROJETO']?.toString().trim(),
        selectedEtapa: selectedStage.trim()
      });

      return projectMatch && stageMatch;
    })
    .map((row, index) => {
      const causaNum = row['ETAPA CAUSA']?.match(/\d+/)?.[0];
      const horasKey = causaNum ? `HORA ${causaNum}` : null;
      const horas = horasKey ? (Number(stageData[horasKey]) || 0) : 0;
      
      console.log('Processando linha da tabela:', {
        causaNum,
        horasKey,
        horas,
        motivos: row.MOTIVOS,
        rawHorasValue: horasKey ? stageData[horasKey] : null
      });

      return {
        id: index + 1,
        description: row.MOTIVOS || '',
        horas
      };
    })
    .filter(item => item.description !== '');

  console.log('Dados processados para a tabela:', filteredData);
  return filteredData;
};

export const calculateCauseMetrics = (groupedData: any[], selectedStage: string): CauseMetrics => {
  if (!selectedStage) {
    return {
      etapaSelecionada: '',
      variacao: 0,
      diferencaHoras: 0
    };
  }

  const stageData = groupedData.find(item => item.name === selectedStage);
  
  if (!stageData) {
    return {
      etapaSelecionada: selectedStage,
      variacao: 0,
      diferencaHoras: 0
    };
  }

  return {
    etapaSelecionada: selectedStage,
    variacao: stageData['Variação PlanXCons'] || 0,
    diferencaHoras: (stageData.Consumido || 0) - (stageData.Planejado || 0)
  };
};