export interface ProjectData {
  'Código do Projeto': string;
  'Descrição da Atividade': string;
  'Descrição Tipo Atividade': string;
  periodo: string;
  'Horas Orçadas': number;
  'Horas Programadas': number;
  'Horas Ajustadas': number;
  'Horas Executadas': number;
  'Saldo de Horas': number;
  'Horas Improdutivas': number;
  'Horas Decimal': number;
}

export interface FilterState {
  codigoProjeto: string;
  etapaProjeto: ProjectStage;
  atividade: string[];
  tipoAtividade: string[];
  periodoInicio: string;
  periodoFim: string;
  classificacaoCausa: string;
}

export interface CauseData {
  CODIGOS: string;
  'ETAPA PROJETO': string;
  CAUSA: string;
  'HORA 1': number;
  'CAUSA 1': string;
  'HORA 2': number;
  'CAUSA 2': string;
  'HORA 3': number;
  'CAUSA 3': string;
  'HORA 4': number;
  'CAUSA 4': string;
  'HORA 5': number;
  'CAUSA 5': string;
  'DIF HORA TOT': number;
}

export interface CauseTableData {
  id: number;
  description: string;
  horas: number;
}

export interface CauseTableRow {
  CODIGOS: string;
  'ETAPA PROJETO': string;
  'ETAPA CAUSA': string;
  MOTIVOS: string;
}

export interface CauseChartData {
  name: string;
  horas: number;
  variacao: number;
}

export interface CauseMetrics {
  etapaSelecionada: string;
  variacao: number;
  diferencaHoras: number;
}

export type ActivityCategory = 
  | 'Visita Técnica'
  | 'Parametrização'
  | 'PTAF'
  | 'TAF'
  | 'TAC'
  | 'Técnico Campo'
  | 'Outros';

export type ProjectStage = 
  | 'todas'
  | 'Parametrização'
  | 'PréTAF'
  | 'TAF'
  | 'TAC'
  | 'Técnico Campo';

export interface ProjectCode {
  original: string;
  display: string;
}