import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import clsx from 'clsx';
import { ProjectStage, ProjectCode, FilterState, FilterOptions } from '../types';
import { isActivityInStage } from '../utils/activityUtils';
import { formatProjectCodeDisplay } from '../utils/projectUtils';

interface SidebarProps {
  filters: FilterOptions;
  selectedFilters: FilterState;
  onFilterChange: (filterType: string, value: string | string[] | ProjectStage) => void;
  periodoInicio: string;
  periodoFim: string;
  onPeriodoChange: (tipo: 'inicio' | 'fim', value: string) => void;
}

const PROJECT_STAGES: ProjectStage[] = [
  'todas',
  'Parametrização',
  'PréTAF',
  'TAF',
  'TAC',
  'Técnico Campo'
];

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  periodoInicio,
  periodoFim,
  onPeriodoChange,
}) => {
  const formattedProjetos = useMemo(() => {
    return formatProjectCodeDisplay(filters.codigoProjeto);
  }, [filters.codigoProjeto]);

  const filteredAtividades = useMemo(() => {
    if (!selectedFilters.codigoProjeto) return [];
    if (selectedFilters.etapaProjeto === 'todas') return filters.atividade;
    
    return filters.atividade.filter(atividade => 
      isActivityInStage(atividade, selectedFilters.etapaProjeto)
    );
  }, [filters.atividade, selectedFilters.codigoProjeto, selectedFilters.etapaProjeto]);

  const handleAtividadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    if (selectedOptions.includes('todas')) {
      onFilterChange('atividade', ['todas']);
    } else {
      onFilterChange('atividade', selectedOptions);
    }
  };

  const handleTipoAtividadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onFilterChange('tipoAtividade', selectedOptions);
  };

  const isProjectSelected = selectedFilters.codigoProjeto !== '';

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      <div className="sticky top-0 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Projeto
            </label>
            <select
              className="w-full border rounded-md p-2 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
              value={selectedFilters.codigoProjeto}
              onChange={(e) => onFilterChange('codigoProjeto', e.target.value)}
            >
              <option value="">Selecione um projeto</option>
              {formattedProjetos.map((projeto: ProjectCode) => (
                <option key={`projeto-${projeto.original}`} value={projeto.original}>
                  {projeto.display}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etapa do Projeto
            </label>
            <select
              className={clsx(
                "w-full border rounded-md p-2 bg-white transition-colors",
                isProjectSelected
                  ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  : "bg-gray-50 text-gray-500 cursor-not-allowed"
              )}
              value={selectedFilters.etapaProjeto}
              onChange={(e) => onFilterChange('etapaProjeto', e.target.value)}
              disabled={!isProjectSelected}
            >
              <option value="todas">Todas as etapas</option>
              {PROJECT_STAGES.filter(stage => stage !== 'todas').map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atividade C&C
            </label>
            <select
              multiple
              size={5}
              className={clsx(
                "w-full border rounded-md p-2 bg-white transition-colors",
                isProjectSelected
                  ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  : "bg-gray-50 text-gray-500 cursor-not-allowed"
              )}
              value={selectedFilters.atividade}
              onChange={handleAtividadeChange}
              disabled={!isProjectSelected}
            >
              <option value="todas">Todas as Atividades</option>
              {filteredAtividades.map((atividade) => (
                <option key={atividade} value={atividade}>
                  {atividade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classificação de Horas
            </label>
            <select
              multiple
              size={5}
              className={clsx(
                "w-full border rounded-md p-2 bg-white transition-colors",
                isProjectSelected
                  ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  : "bg-gray-50 text-gray-500 cursor-not-allowed"
              )}
              value={selectedFilters.tipoAtividade}
              onChange={handleTipoAtividadeChange}
              disabled={!isProjectSelected}
            >
              {filters.tipoAtividade.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <div className="space-y-2">
              <input
                type="month"
                className={clsx(
                  "w-full border rounded-md p-2 bg-white transition-colors",
                  isProjectSelected
                    ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    : "bg-gray-50 text-gray-500 cursor-not-allowed"
                )}
                value={periodoInicio}
                onChange={(e) => onPeriodoChange('inicio', e.target.value)}
                disabled={!isProjectSelected}
              />
              <input
                type="month"
                className={clsx(
                  "w-full border rounded-md p-2 bg-white transition-colors",
                  isProjectSelected
                    ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    : "bg-gray-50 text-gray-500 cursor-not-allowed"
                )}
                value={periodoFim}
                onChange={(e) => onPeriodoChange('fim', e.target.value)}
                disabled={!isProjectSelected}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classificação de Causa
            </label>
            <select
              className={clsx(
                "w-full border rounded-md p-2 bg-white transition-colors",
                isProjectSelected
                  ? "hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  : "bg-gray-50 text-gray-500 cursor-not-allowed"
              )}
              value={selectedFilters.classificacaoCausa}
              onChange={(e) => onFilterChange('classificacaoCausa', e.target.value)}
              disabled={!isProjectSelected}
            >
              <option value="">Selecione uma Etapa</option>
              {filters.classificacaoCausa.map((causa) => (
                <option key={causa} value={causa}>
                  {causa}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};