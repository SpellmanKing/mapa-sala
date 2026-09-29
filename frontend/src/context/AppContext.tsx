import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import {
  CursoService,
  InstrutorService,
  SalaService,
  TurmaService,
  type CursoApi,
  type InstrutorApi,
  type SalaApi,
  type TipoSalaApi,
  type TurmaApi
} from '../api/client';
import { SHIFTS } from '../constants/referenceData';
import { createResourceCache } from '../utils/resourceCache.js';
import { useAuth } from './AuthContext';

export type Modality = 'Presencial' | 'Semi-Presencial' | 'Remoto';
export type DataResource = 'cursos' | 'salas' | 'instrutores' | 'turmas' | 'tiposSala';

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria: number;
  segmento?: string;
  diasSemana: string[];
  diasRemotos: string[];
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
  recursosEspeciais?: string;
  local?: string;
  idTipoSala?: number;
}

export interface Instrutor {
  id: string;
  nome: string;
}

export interface TurmaDetalhada {
  id: string;
  cursoId: string;
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
  instrutorId?: string;
  totalAlunos: number;
}

export interface TipoSala {
  id: string;
  nome: string;
}

interface AppDataContextData {
  cursos: Curso[];
  salas: Sala[];
  instrutores: Instrutor[];
  turmas: TurmaDetalhada[];
  tipoSalas: TipoSala[];
  isLoading: boolean;
  loadData: (resources: DataResource[]) => Promise<void>;
  refreshCursos: () => Promise<void>;
  refreshSalas: () => Promise<void>;
  refreshInstrutores: () => Promise<void>;
  refreshTurmas: () => Promise<void>;
  refreshTipoSalas: () => Promise<void>;
}

interface AppUiContextData {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppDataContext = createContext<AppDataContextData | undefined>(undefined);
const AppUiContext = createContext<AppUiContextData | undefined>(undefined);

const mapCursos = (data: CursoApi[]): Curso[] => data.map(curso => ({
  id: String(curso.id_cursos),
  nome: curso.nome_curso,
  cargaHoraria: curso.carga_horaria || 160,
  segmento: curso.segmento || 'Tecnologia da Informação',
  diasSemana: curso.dias_letivos_padrao?.split(',') ?? [],
  diasRemotos: curso.dias_remotos_padrao?.split(',') ?? [],
  codigoTurmaPadrao: curso.codigo_turma_padrao ?? undefined,
  turnoPadrao: curso.turno_padrao ?? undefined,
  modalidade: curso.modalidade as Modality,
  instrutorId: curso.id_instrutor_padrao ? String(curso.id_instrutor_padrao) : '',
  unidade: curso.unidade ?? ''
}));

const mapInstrutores = (data: InstrutorApi[]): Instrutor[] => data.map(instrutor => ({
  id: String(instrutor.id_instrutores),
  nome: instrutor.nome_instrutor
}));

const mapTiposSala = (data: TipoSalaApi[]): TipoSala[] => data.map(tipo => ({
  id: String(tipo.idTipo_sala),
  nome: tipo.nome_tipo
}));

const mapSalas = (data: SalaApi[]): Sala[] => data.map(sala => ({
  id: String(sala.id_salas),
  nome: sala.nome_sala,
  capacidade: sala.capacidade_maxima,
  tipo: sala.tipoSala?.nome_tipo || 'Comum',
  recursosEspeciais: sala.recursos_especiais ?? '',
  local: sala.local ?? '',
  idTipoSala: sala.idTipo_sala ?? undefined
}));

const mapTurmas = (data: TurmaApi[]): TurmaDetalhada[] => data.map(turma => ({
  id: String(turma.id_turmas),
  cursoId: String(turma.id_cursos),
  salaId: turma.agendamentos[0] ? String(turma.agendamentos[0].id_salas) : '',
  cursoNome: turma.curso.nome_curso || 'Curso Desconhecido',
  instrutorNome: turma.instrutor?.nome_instrutor || 'Sem Instrutor',
  turno: turma.turno?.nome_turno || SHIFTS[0].label,
  dataInicio: turma.data_inicio?.split('T')[0] ?? '',
  dataFim: turma.data_termino?.split('T')[0] ?? '',
  codigo: turma.codigo_turma,
  modalidade: turma.curso.modalidade || 'Presencial',
  unidade: turma.curso.unidade ?? '',
  diasSemana: turma.dias_semana
    ? turma.dias_semana.split(',')
    : turma.curso.dias_letivos_padrao?.split(',') ?? [],
  diasRemotos: turma.curso.dias_remotos_padrao?.split(',') ?? [],
  cursoTem: turma.curso.curso_tem,
  instrutorId: turma.id_instrutores ? String(turma.id_instrutores) : '',
  totalAlunos: turma.total_alunos
}));

function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [turmas, setTurmas] = useState<TurmaDetalhada[]>([]);
  const [tipoSalas, setTipoSalas] = useState<TipoSala[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef(createResourceCache());
  const activeLoads = useRef(0);
  const loadGeneration = useRef(0);

  const loadCursos = useCallback((force = false) =>
    cache.current.load('cursos', CursoService.getAll, data => setCursos(mapCursos(data)), force), []);
  const loadSalas = useCallback((force = false) =>
    cache.current.load('salas', SalaService.getAll, data => setSalas(mapSalas(data)), force), []);
  const loadInstrutores = useCallback((force = false) =>
    cache.current.load('instrutores', InstrutorService.getAll, data => setInstrutores(mapInstrutores(data)), force), []);
  const loadTurmas = useCallback((force = false) =>
    cache.current.load('turmas', TurmaService.getAll, data => setTurmas(mapTurmas(data)), force), []);
  const loadTipoSalas = useCallback((force = false) =>
    cache.current.load('tiposSala', SalaService.getTipos, data => setTipoSalas(mapTiposSala(data)), force), []);

  const loaders = useMemo(() => ({
    cursos: loadCursos,
    salas: loadSalas,
    instrutores: loadInstrutores,
    turmas: loadTurmas,
    tiposSala: loadTipoSalas
  }), [loadCursos, loadInstrutores, loadSalas, loadTipoSalas, loadTurmas]);

  const loadData = useCallback(async (resources: DataResource[]) => {
    const generation = loadGeneration.current;
    activeLoads.current += 1;
    setIsLoading(true);
    try {
      await Promise.all(resources.map(resource => loaders[resource]()));
    } finally {
      if (generation === loadGeneration.current) {
        activeLoads.current = Math.max(0, activeLoads.current - 1);
        setIsLoading(activeLoads.current > 0);
      }
    }
  }, [loaders]);

  useEffect(() => {
    if (isAuthenticated) return;
    loadGeneration.current += 1;
    activeLoads.current = 0;
    cache.current.clear();
    setCursos([]);
    setSalas([]);
    setInstrutores([]);
    setTurmas([]);
    setTipoSalas([]);
    setIsLoading(false);
  }, [isAuthenticated]);

  const value = useMemo<AppDataContextData>(() => ({
    cursos,
    salas,
    instrutores,
    turmas,
    tipoSalas,
    isLoading,
    loadData,
    refreshCursos: () => loadCursos(true).then(() => undefined),
    refreshSalas: () => loadSalas(true).then(() => undefined),
    refreshInstrutores: () => loadInstrutores(true).then(() => undefined),
    refreshTurmas: () => loadTurmas(true).then(() => undefined),
    refreshTipoSalas: () => loadTipoSalas(true).then(() => undefined)
  }), [
    cursos,
    instrutores,
    isLoading,
    loadCursos,
    loadData,
    loadInstrutores,
    loadSalas,
    loadTipoSalas,
    loadTurmas,
    salas,
    tipoSalas,
    turmas
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function UiProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(previous => {
      const next = previous === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ theme, toggleTheme, showToast }), [theme, toggleTheme, showToast]);

  return (
    <AppUiContext.Provider value={value}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`fixed top-6 right-6 z-[9999] max-w-sm w-full bg-card border border-border rounded-2xl flex p-4 animate-slide-in pointer-events-auto overflow-hidden relative ${
            toast.type === 'success'
              ? 'border-l-4 border-l-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              : toast.type === 'error'
                ? 'border-l-4 border-l-red-500 shadow-[0_0_25px_rgba(239,68,68,0.22)]'
                : 'border-l-4 border-l-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
          }`}
        >
          <div className={`absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06] ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`} />
          <div className={`mr-3 mt-0.5 flex items-start ${
            toast.type === 'success' ? 'text-emerald-500' : toast.type === 'error' ? 'text-red-500' : 'text-blue-500'
          }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}
          </div>
          <div className="flex-1">
            <h3 className="mb-0.5 text-xs font-black uppercase tracking-wider text-text-muted">
              {toast.type === 'error' ? 'Erro de Sistema' : toast.type === 'success' ? 'Sucesso' : 'Aviso'}
            </h3>
            <p className="text-sm font-semibold leading-snug text-text-main">{toast.message}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => setToast(null)}
            className="ml-3 self-start text-text-muted transition-colors hover:text-text-main"
          >
            ×
          </button>
        </div>
      )}
    </AppUiContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <UiProvider>
      <DataProvider>{children}</DataProvider>
    </UiProvider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppProvider');
  return context;
}

export function useAppUi() {
  const context = useContext(AppUiContext);
  if (!context) throw new Error('useAppUi must be used within AppProvider');
  return context;
}
