import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Modality = 'Presencial' | 'Remoto';

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria: number;
  diasSemana: string[]; // ['1', '2', '3'] = Mon, Tue, Wed
  modalidade: Modality;
}

export interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  tipo: string;
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
  salas: Sala[];
  setSalas: React.Dispatch<React.SetStateAction<Sala[]>>;
  agendamentos: Agendamento[];
  setAgendamentos: React.Dispatch<React.SetStateAction<Agendamento[]>>;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

import { CursoService, SalaService, TurmaService } from '../api/client';
import { useEffect } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
  // Seed inicial substituído por dados dinâmicos
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    // Carregar Cursos
    CursoService.getAll().then((data: any) => {
      const mappedCursos = data.map((c: any) => ({
        id: c.id_cursos.toString(),
        nome: c.nome_curso,
        cargaHoraria: c.carga_horaria,
        diasSemana: ['1','2','3','4','5'], // TODO: adicionar lógica
        modalidade: c.modalidade
      }));
      setCursos(mappedCursos);
    });

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

    // Carregar Agendamentos (Turmas e Salas)
    TurmaService.getAgendamentos().then((data: any) => {
      const mappedAgendamentos = data.map((ag: any) => ({
        id: ag.id_agendamento.toString(),
        salaId: ag.id_salas.toString(),
        date: ag.data_aula.split('T')[0],
        cursoId: ag.turma.id_cursos.toString(),
        turno: 'Manhã', // TODO: Mapear turnos
        cor: '#0511F2',
        modalidade: ag.turma.curso?.modalidade || 'Presencial'
      }));
      setAgendamentos(mappedAgendamentos);
    });
  }, []);

  return (
    <AppContext.Provider value={{ cursos, setCursos, salas, setSalas, agendamentos, setAgendamentos }}>
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
