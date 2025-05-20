import React, { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Sidebar } from './components/Sidebar';
import { MetricsDisplay } from './components/MetricsDisplay';
import { Charts } from './components/Charts';
import { CauseMetricsDisplay } from './components/CauseMetricsDisplay';
import { CauseChart } from './components/CauseChart';
import type { FilterState, ProjectData, ProjectStage, CauseData, CauseTableRow, CauseTableData } from './types';
import { categorizarTipoAtividade, isHoraImprodutiva, mapActivityToCategory, isActivityInStage } from './utils/activityUtils';
import { parseExcelDate, isDateInRange } from './utils/dateUtils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { loadCauseData, getAvailableCauseStages, getCauseChartData, calculateCauseMetrics, getCauseTableData } from './utils/causeUtils';

function App() {
  const [projetosData, setProjetosData] = useState<ProjectData[]>([]);
  const [horasData, setHorasData] = useState<any[]>([]);
  const [causeData, setCauseData] = useState<CauseData[]>([]);
  const [causeTableData, setCauseTableData] = useState<CauseTableRow[]>([]);
  const [dateRange, setDateRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [filters, setFilters] = useState<FilterState>({
    codigoProjeto: '',
    etapaProjeto: 'todas',
    atividade: [],
    tipoAtividade: [],
    periodoInicio: '',
    periodoFim: '',
    classificacaoCausa: ''
  });

  const [availableFilters, setAvailableFilters] = useState({
    codigoProjeto: [] as string[],
    atividade: [] as string[],
    tipoAtividade: ['Todos os Tipos', 'Produtivas', 'Improdutivas', 'Fora do escopo', 'Translado'],
    classificacaoCausa: [] as string[]
  });

  useEffect(() => {
    const loadExcelFiles = async () => {
      try {
        const [projetosResponse, horasResponse] = await Promise.all([
          fetch('/documents/Projetos_em_Horas.xlsx'),
          fetch('/documents/Horas_Detalhadas.xlsx')
        ]);

        if (!projetosResponse.ok || !horasResponse.ok) {
          throw new Error('Falha ao carregar arquivos Excel');
        }

        const projetosArrayBuffer = await projetosResponse.arrayBuffer();
        const horasArrayBuffer = await horasResponse.arrayBuffer();

        const projetosWorkbook = read(projetosArrayBuffer, { type: 'array' });
        const horasWorkbook = read(horasArrayBuffer, { type: 'array' });

        const projetosSheet = projetosWorkbook.Sheets['Extração de Dados'];
        const horasSheet = horasWorkbook.Sheets[horasWorkbook.SheetNames[0]];

        const projetosJson = utils.sheet_to_json(projetosSheet, { raw: true });
        const horasJson = utils.sheet_to_json(horasSheet, { raw: true });

        const datas = horasJson
          .map((row: any) => parseExcelDate(row['Data Apontamento']))
          .filter((date): date is Date => date !== null);

        if (datas.length > 0) {
          const minDate = new Date(Math.min(...datas.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...datas.map(d => d.getTime())));

          setDateRange({
            min: startOfMonth(minDate).toISOString().slice(0, 7),
            max: endOfMonth(maxDate).toISOString().slice(0, 7)
          });
        }

        setProjetosData(projetosJson as ProjectData[]);
        setHorasData(horasJson);

        const codigosProjetos = Array.from(new Set(projetosJson
          .map((row: any) => row['Cod Projeto']?.toString().trim())
          .filter(Boolean)))
          .sort();

        setAvailableFilters(prev => ({
          ...prev,
          codigoProjeto: codigosProjetos
        }));

        // Carregar dados de causas
        const { causes, tableData } = await loadCauseData();
        setCauseData(causes || []);
        setCauseTableData(tableData || []);

      } catch (error) {
        console.error('Erro ao carregar arquivos Excel:', error);
      }
    };

    loadExcelFiles();
  }, []);

  useEffect(() => {
    if (!filters.codigoProjeto) {
      setAvailableFilters(prev => ({ 
        ...prev, 
        atividade: [],
        classificacaoCausa: []
      }));
      return;
    }

    // Atualizar atividades disponíveis
    const atividadesProjetos = projetosData
      .filter((row: any) => row['Cod Projeto']?.toString().trim() === filters.codigoProjeto)
      .map((row: any) => row['Descrição do Item']?.toString().trim())
      .filter(Boolean);

    const todasAtividades = Array.from(new Set(atividadesProjetos)).sort();

    // Atualizar etapas de causa disponíveis
    const etapasCausa = getAvailableCauseStages(causeData || [], filters.codigoProjeto);

    setAvailableFilters(prev => ({ 
      ...prev, 
      atividade: todasAtividades,
      classificacaoCausa: etapasCausa
    }));
    
    setFilters(prev => ({ 
      ...prev, 
      atividade: ['todas'],
      classificacaoCausa: ''
    }));
  }, [filters.codigoProjeto, projetosData, causeData]);

  const handleFilterChange = (filterType: keyof FilterState, value: string | string[] | ProjectStage) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value,
      };

      if (filterType === 'etapaProjeto') {
        newFilters.atividade = ['todas'];
      }

      return newFilters;
    });
  };

  const handlePeriodoChange = (tipo: 'inicio' | 'fim', value: string) => {
    setFilters(prev => ({
      ...prev,
      [`periodo${tipo === 'inicio' ? 'Inicio' : 'Fim'}`]: value,
    }));
  };

  const calcularHorasImprodutivas = (projetoId: string, atividade?: string) => {
    if (!horasData.length) return 0;

    const horasImprodutivasProjeto = horasData.filter((item: any) => {
      const descricaoTipo = item['Descrição Tipo Atividade']?.toString().trim() || '';
      const codigoProjeto = item['Código do Projeto']?.toString().trim();
      const dataApontamento = item['Data Apontamento'];
      const descricaoAtividade = item['Descrição da Atividade']?.toString().trim();
      
      if (!descricaoTipo || codigoProjeto !== projetoId) return false;
      
      if (filters.periodoInicio || filters.periodoFim) {
        if (!isDateInRange(dataApontamento, filters.periodoInicio, filters.periodoFim)) {
          return false;
        }
      }
      
      if (atividade && descricaoAtividade !== atividade) {
        return false;
      }

      const categoria = categorizarTipoAtividade(descricaoTipo);
      return isHoraImprodutiva(categoria);
    });

    return horasImprodutivasProjeto.reduce((sum: number, item: any) => 
      sum + (Number(item['Horas Decimal']) || 0), 0);
  };

  const calcularMetricas = () => {
    if (!filters.codigoProjeto) {
      return {
        horasVendidas: 0,
        horasPlanejadas: 0,
        horasConsumidas: 0,
        horasImprodutivas: 0,
        saldoHoras: 0,
      };
    }

    let dadosFiltrados = projetosData.filter((item: any) => 
      item['Cod Projeto']?.toString().trim() === filters.codigoProjeto
    );

    if (filters.etapaProjeto !== 'todas') {
      dadosFiltrados = dadosFiltrados.filter((item: any) => 
        isActivityInStage(item['Descrição do Item']?.toString().trim(), filters.etapaProjeto)
      );
    }

    if (filters.atividade.length > 0 && !filters.atividade.includes('todas')) {
      dadosFiltrados = dadosFiltrados.filter((item: any) => 
        filters.atividade.includes(item['Descrição do Item']?.toString().trim())
      );
    }

    const metrics = {
      horasVendidas: dadosFiltrados.reduce((sum, item) => sum + (Number(item['Hs Orçadas']) || 0), 0),
      horasPlanejadas: dadosFiltrados.reduce((sum, item) => sum + (Number(item['Hs Programadas']) || 0), 0),
      horasConsumidas: dadosFiltrados.reduce((sum, item) => sum + (Number(item['Hs Executadas']) || 0), 0),
      saldoHoras: dadosFiltrados.reduce((sum, item) => sum + (Number(item['Hs Saldo']) || 0), 0),
      horasImprodutivas: 0
    };

    if (filters.tipoAtividade.length > 0 && !filters.tipoAtividade.includes('Todos os Tipos') ||
        filters.periodoInicio || filters.periodoFim) {
      
      const horasConsumidas = horasData.filter((item: any) => {
        const codigoProjeto = item['Código do Projeto']?.toString().trim();
        const descricaoAtividade = item['Descrição da Atividade']?.toString().trim();
        const dataApontamento = item['Data Apontamento'];
        
        if (codigoProjeto !== filters.codigoProjeto) return false;

        if (filters.etapaProjeto !== 'todas' && !isActivityInStage(descricaoAtividade, filters.etapaProjeto)) {
          return false;
        }

        if (filters.atividade.length > 0 && !filters.atividade.includes('todas')) {
          if (!filters.atividade.includes(descricaoAtividade)) {
            return false;
          }
        }

        if (filters.periodoInicio || filters.periodoFim) {
          if (!isDateInRange(dataApontamento, filters.periodoInicio, filters.periodoFim)) {
            return false;
          }
        }

        if (filters.tipoAtividade.length > 0 && !filters.tipoAtividade.includes('Todos os Tipos')) {
          const descricaoTipo = item['Descrição Tipo Atividade']?.toString().trim() || '';
          const categoria = categorizarTipoAtividade(descricaoTipo);
          if (!filters.tipoAtividade.includes(categoria)) {
            return false;
          }
        }

        return true;
      });

      metrics.horasConsumidas = horasConsumidas.reduce((sum: number, item: any) => 
        sum + (Number(item['Horas Decimal']) || 0), 0);
    }

    metrics.horasImprodutivas = calcularHorasImprodutivas(filters.codigoProjeto);

    return metrics;
  };

  const metrics = calcularMetricas();
  
  const atividadeData = availableFilters.atividade
    .filter(atividade => atividade !== 'todas')
    .map(atividade => {
      const dadosAtividade = projetosData.filter((item: any) => 
        item['Cod Projeto']?.toString().trim() === filters.codigoProjeto && 
        item['Descrição do Item']?.toString().trim() === atividade
      );

      let horasConsumidas = dadosAtividade.reduce((sum, item) => 
        sum + (Number(item['Hs Executadas']) || 0), 0);

      if (filters.tipoAtividade.length > 0 && !filters.tipoAtividade.includes('Todos os Tipos') ||
          filters.periodoInicio || filters.periodoFim) {
        
        const horasDetalhadas = horasData.filter((item: any) => {
          const codigoProjeto = item['Código do Projeto']?.toString().trim();
          const descricaoAtividade = item['Descrição da Atividade']?.toString().trim();
          const dataApontamento = item['Data Apontamento'];
          
          if (codigoProjeto !== filters.codigoProjeto || descricaoAtividade !== atividade) {
            return false;
          }

          if (filters.periodoInicio || filters.periodoFim) {
            if (!isDateInRange(dataApontamento, filters.periodoInicio, filters.periodoFim)) {
              return false;
            }
          }

          if (filters.tipoAtividade.length > 0 && !filters.tipoAtividade.includes('Todos os Tipos')) {
            const descricaoTipo = item['Descrição Tipo Atividade']?.toString().trim() || '';
            const categoria = categorizarTipoAtividade(descricaoTipo);
            if (!filters.tipoAtividade.includes(categoria)) {
              return false;
            }
          }

          return true;
        });

        horasConsumidas = horasDetalhadas.reduce((sum: number, item: any) => 
          sum + (Number(item['Horas Decimal']) || 0), 0);
      }

      const horasImprodutivas = calcularHorasImprodutivas(filters.codigoProjeto, atividade);

      return {
        name: atividade,
        category: mapActivityToCategory(atividade),
        horasVendidas: dadosAtividade.reduce((sum, item) => sum + (Number(item['Hs Orçadas']) || 0), 0),
        horasPlanejadas: dadosAtividade.reduce((sum, item) => sum + (Number(item['Hs Programadas']) || 0), 0),
        horasConsumidas,
        horasImprodutivas,
        saldoHoras: dadosAtividade.reduce((sum, item) => sum + (Number(item['Hs Saldo']) || 0), 0),
      };
    });

  const groupedData = Object.values(
    atividadeData.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          name: item.category,
          Vendido: 0,
          Planejado: 0,
          Consumido: 0,
          Improdutivo: 0,
          'Variação PlanXCons': 0
        };
      }
      
      acc[item.category].Vendido += item.horasVendidas;
      acc[item.category].Planejado += item.horasPlanejadas;
      acc[item.category].Consumido += item.horasConsumidas;
      acc[item.category].Improdutivo += item.horasImprodutivas;
      
      if (acc[item.category].Planejado > 0) {
        acc[item.category]['Variação PlanXCons'] = 
          (acc[item.category].Consumido / acc[item.category].Planejado) * 100;
      }
      
      return acc;
    }, {})
  ).filter(item => ['Parametrização', 'PTAF', 'TAF', 'Técnico Campo', 'TAC'].includes(item.name))
   .sort((a, b) => {
     const order = ['Parametrização', 'PTAF', 'TAF', 'Técnico Campo', 'TAC'];
     return order.indexOf(a.name) - order.indexOf(b.name);
   });

  const causeChartData = getCauseChartData(
    causeData || [],
    filters.codigoProjeto,
    filters.classificacaoCausa
  );

  const tableData = getCauseTableData(
    causeData || [],
    causeTableData || [],
    filters.codigoProjeto,
    filters.classificacaoCausa
  );

  const causeMetrics = calculateCauseMetrics(groupedData, filters.classificacaoCausa);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        filters={availableFilters}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        periodoInicio={filters.periodoInicio}
        periodoFim={filters.periodoFim}
        onPeriodoChange={handlePeriodoChange}
      />
      <main className="flex-1 p-6">
        <MetricsDisplay metrics={metrics} />
        <Charts atividadeData={groupedData} />
        <div className="mt-6">
          <CauseMetricsDisplay metrics={causeMetrics} />
          <CauseChart data={causeChartData} tableData={tableData} />
        </div>
      </main>
    </div>
  );
}

export default App;