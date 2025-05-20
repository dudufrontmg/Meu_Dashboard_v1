import { ActivityCategory, ProjectStage } from '../types';

export const categorizarTipoAtividade = (descricao: string): string => {
  if (!descricao) return '';

  const descricaoLower = descricao.toLowerCase();

  if (descricaoLower.includes('horas improdutivas') || 
      descricaoLower.includes('improdutivas')) {
    return 'Improdutivas';
  }

  if (descricaoLower.includes('fora de escopo') || 
      descricaoLower.includes('fora do escopo')) {
    return 'Fora do escopo';
  }

  if (descricaoLower.includes('traslado') || 
      descricaoLower.includes('translado')) {
    return 'Translado';
  }

  return 'Produtivas';
};

export const isHoraImprodutiva = (categoria: string): boolean => {
  return ['Improdutivas', 'Fora do escopo', 'Translado'].includes(categoria);
};

export const isActivityInStage = (activityName: string, stage: ProjectStage): boolean => {
  if (!activityName || stage === 'todas') return true;

  const activityLower = activityName.toLowerCase();
  const activityTrimmed = activityName.trim();

  switch (stage) {
    case 'Parametrização':
      return activityTrimmed.startsWith('Configuração_') || 
             activityTrimmed === 'Parametrização' ||
             activityLower.includes('configuração') ||
             activityLower.includes('configuracao');
    case 'PréTAF':
      return activityTrimmed.startsWith('PréTestes_') || 
             activityTrimmed === 'PréTAF' ||
             activityLower.includes('prétestes') ||
             activityLower.includes('pretestes') ||
             activityLower.includes('pré-testes') ||
             activityLower.includes('pre-testes');
    case 'TAF':
      return activityTrimmed.startsWith('TAF_') || 
             activityTrimmed === 'TAF' ||
             activityLower.includes('taf');
    case 'TAC':
      return activityTrimmed.startsWith('TAC_') || 
             activityTrimmed === 'TAC' ||
             activityLower.includes('tac');
    case 'Técnico Campo':
      return activityLower.includes('campo') || 
             activityLower.includes('montagem_campo') || 
             activityLower.includes('eletricista') || 
             activityLower.includes('técnico') ||
             activityLower.includes('tecnico');
    default:
      return false;
  }
};

export const mapActivityToCategory = (activityName: string): ActivityCategory => {
  if (!activityName) return 'Outros';

  const activityLower = activityName.toLowerCase().trim();

  if (activityLower === 'visita técnica' || activityLower === 'visita tecnica') {
    return 'Visita Técnica';
  }

  if (activityLower.startsWith('configuração_') || 
      activityLower.startsWith('configuracao_') ||
      activityLower.includes('parametrização') ||
      activityLower.includes('parametrizacao')) {
    return 'Parametrização';
  }

  if (activityLower.startsWith('prétestes_') || 
      activityLower.startsWith('pretestes_') ||
      activityLower.includes('pré-taf') ||
      activityLower.includes('pre-taf')) {
    return 'PTAF';
  }

  if (activityLower.startsWith('taf_') || activityLower === 'taf') {
    return 'TAF';
  }

  if (activityLower.startsWith('tac_') || activityLower === 'tac') {
    return 'TAC';
  }

  if (activityLower.includes('campo') || 
      activityLower.includes('técnico') ||
      activityLower.includes('tecnico')) {
    return 'Técnico Campo';
  }

  return 'Outros';
};