import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CursoService, SalaService, TurmaService, InstrutorService } from '../api/client';

export type Modality = 'Presencial' | 'Semi-Presencial' | 'Remoto';

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria: number;
  diasSemana: string[]; // Presenciais
  diasRemotos: string[]; // Remotos
  codigoTurmaPadrao?: string;
  turnoPadrao?: string;
  modalidade: Modality;
  instrutorId?: string;
  unidade?: string;
}

export interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  tipo: string;
}

export interface Instrutor {
  id: string;
  nome: string;
}

export interface TurmaDetalhada {
  id: string;
  salaId: string;
  cursoNome: string;
  instrutorNome: string;
  turno: string;
  dataInicio: string;
  dataFim: string;
  codigo: string;
  modalidade: string;
  unidade?: string;
  diasSemana: string[];
  diasRemotos: string[];
  cursoTem?: boolean;
}

export interface TipoSala {
  id: string;
  nome: string;
}

interface AppContextData {
  cursos: Curso[];
  setCursos: React.Dispatch<React.SetStateAction<Curso[]>>;
  refreshCursos: () => void;
  salas: Sala[];
  setSalas: React.Dispatch<React.SetStateAction<Sala[]>>;
  instrutores: Instrutor[];
  setInstrutores: React.Dispatch<React.SetStateAction<Instrutor[]>>;
  refreshInstrutores: () => void;
  turmas: TurmaDetalhada[];
  setTurmas: React.Dispatch<React.SetStateAction<TurmaDetalhada[]>>;
  refreshTurmas: () => void;
  tipoSalas: TipoSala[];
  refreshTipoSalas: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [turmas, setTurmas] = useState<TurmaDetalhada[]>([]);
  const [tipoSalas, setTipoSalas] = useState<TipoSala[]>([]);

  // Tema Claro/Escuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const refreshInstrutores = useCallback(() => {
    InstrutorService.getAll().then((data: any) => {
      const mapped = data.map((i: any) => ({
        id: i.id_instrutores.toString(),
        nome: i.nome_instrutor
      }));
      setInstrutores(mapped);
    });
  }, []);

  const refreshTipoSalas = useCallback(() => {
    SalaService.getTipos().then((data: any) => {
      const mapped = data.map((t: any) => ({
        id: t.idTipo_sala.toString(),
        nome: t.nome_tipo
      }));
      setTipoSalas(mapped);
    });
  }, []);

  const refreshCursos = useCallback(() => {
    CursoService.getAll().then((data: any) => {
      const mappedCursos = data.map((c: any) => ({
        id: c.id_cursos.toString(),
        nome: c.nome_curso,
        cargaHoraria: c.carga_horaria,
        diasSemana: c.dias_letivos_padrao ? c.dias_letivos_padrao.split(',') : [], 
        diasRemotos: c.dias_remotos_padrao ? c.dias_remotos_padrao.split(',') : [],
        codigoTurmaPadrao: c.codigo_turma_padrao,
        turnoPadrao: c.turno_padrao,
        modalidade: c.modalidade as Modality,
        instrutorId: c.id_instrutor_padrao ? c.id_instrutor_padrao.toString() : '', 
        unidade: c.unidade || ''
      }));
      setCursos(mappedCursos);
    });
  }, []);

  const refreshTurmas = useCallback(() => {
    TurmaService.getAll().then((data: any) => {
      const mapped = data.map((t: any) => {
        // Encontrar a sala a partir do primeiro agendamento, se houver
        const salaId = t.agendamentos && t.agendamentos.length > 0 ? t.agendamentos[0].id_salas.toString() : '';
        return {
          id: t.id_turmas.toString(),
          salaId: salaId,
          cursoNome: t.curso?.nome_curso || 'Curso Desconhecido',
          instrutorNome: t.instrutor?.nome_instrutor || 'Sem Instrutor',
          turno: t.turno?.nome_turno || 'Manhã',
          dataInicio: t.data_inicio ? t.data_inicio.split('T')[0] : '',
          dataFim: t.data_termino ? t.data_termino.split('T')[0] : '',
          codigo: t.codigo_turma,
          modalidade: t.curso?.modalidade || 'Presencial',
          unidade: t.curso?.unidade || '',
          diasSemana: t.curso?.dias_letivos_padrao ? t.curso.dias_letivos_padrao.split(',') : [],
          diasRemotos: t.curso?.dias_remotos_padrao ? t.curso.dias_remotos_padrao.split(',') : [],
          cursoTem: t.curso?.curso_tem || false
        };
      });
      setTurmas(mapped);
    });
  }, []);

  useEffect(() => {
    refreshCursos();
    refreshTipoSalas();

    // Carregar Salas
    SalaService.getAll().then((data: any) => {
      const mappedSalas = data.map((s: any) => ({
        id: s.id_salas.toString(),
        nome: s.nome_sala,
        capacidade: s.capacidade_maxima,
        tipo: s.tipoSala?.nome_tipo || 'Comum'
      }));
      setSalas(mappedSalas);
    });

    refreshInstrutores();
    refreshTurmas();
  }, [refreshCursos, refreshInstrutores, refreshTurmas, refreshTipoSalas]);

  return (
    <AppContext.Provider value={{ cursos, setCursos, refreshCursos, salas, setSalas, instrutores, setInstrutores, refreshInstrutores, turmas, setTurmas, refreshTurmas, tipoSalas, refreshTipoSalas, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
