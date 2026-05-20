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

export function AppProvider({ children }: { children: ReactNode }) {
  // Mock Initial Data
  const [cursos, setCursos] = useState<Curso[]>([
    { id: 'c-1', nome: 'Técnico em Administração', cargaHoraria: 800, diasSemana: ['1', '3', '5'], modalidade: 'Presencial' },
    { id: 'c-2', nome: 'Lógica de Programação', cargaHoraria: 40, diasSemana: ['2', '4'], modalidade: 'Remoto' },
  ]);

  const [salas, setSalas] = useState<Sala[]>([
    { id: 's-1', nome: 'Sala Inovadora S-1', capacidade: 28, tipo: 'Inovadora' },
    { id: 'i-1', nome: 'Lab. Informática I-1', capacidade: 28, tipo: 'TI' },
  ]);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([
    { id: 'ag-1', salaId: 's-1', date: '2026-05-20', cursoId: 'c-1', turno: 'Manhã', cor: '#0511F2', modalidade: 'Presencial' },
  ]);

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
