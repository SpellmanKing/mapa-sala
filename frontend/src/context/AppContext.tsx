import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CursoService, SalaService, TurmaService, InstrutorService } from '../api/client';

export type Modality = 'Presencial' | 'Semi-Presencial' | 'Remoto';

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria: number;
  diasSemana: string[]; // ['1', '2', '3'] = Mon, Tue, Wed
  modalidade: Modality;
  instrutorId?: string;
  ambienteId?: string;
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

export interface Agendamento {
  id: string;
  salaId: string;
  date: string; // YYYY-MM-DD
  cursoId: string;
  turno: string;
  cor: string;
  modalidade: Modality;
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
  agendamentos: Agendamento[];
  setAgendamentos: React.Dispatch<React.SetStateAction<Agendamento[]>>;
  refreshAgendamentos: () => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const refreshInstrutores = useCallback(() => {
    InstrutorService.getAll().then((data: any) => {
      const mapped = data.map((i: any) => ({
        id: i.id_instrutores.toString(),
        nome: i.nome_instrutor
      }));
      setInstrutores(mapped);
    });
  }, []);

  const refreshCursos = useCallback(() => {
    CursoService.getAll().then((data: any) => {
      const mappedCursos = data.map((c: any) => ({
        id: c.id_cursos.toString(),
        nome: c.nome_curso,
        cargaHoraria: c.carga_horaria,
        diasSemana: ['1','2','3','4','5'], 
        modalidade: c.modalidade as Modality,
        instrutorId: '', 
        ambienteId: c.idTipo_sala ? c.idTipo_sala.toString() : ''
      }));
      setCursos(mappedCursos);
    });
  }, []);

  const refreshAgendamentos = useCallback(() => {
    TurmaService.getAgendamentos().then((data: any) => {
      const mappedAgendamentos = data.map((ag: any) => ({
        id: ag.id_agendamento.toString(),
        salaId: ag.id_salas.toString(),
        date: ag.data_aula.split('T')[0],
        cursoId: ag.turma.id_cursos.toString(),
        turno: 'Manhã', 
        cor: '#0511F2',
        modalidade: ag.turma.curso?.modalidade as Modality || 'Presencial'
      }));
      setAgendamentos(mappedAgendamentos);
    });
  }, []);

  useEffect(() => {
    refreshCursos();

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
    refreshAgendamentos();
  }, [refreshCursos, refreshInstrutores, refreshAgendamentos]);

  return (
    <AppContext.Provider value={{ cursos, setCursos, refreshCursos, salas, setSalas, instrutores, setInstrutores, refreshInstrutores, agendamentos, setAgendamentos, refreshAgendamentos }}>
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
