import axios from 'axios';

export type Permission = 'VIEW' | 'ALLOCATE' | 'MANAGE' | 'ADMIN';
export type AuthUser = { id: number; email: string; role: string };
export type AuthSession = {
  success: true;
  user: AuthUser;
  permissions: Permission[];
};
export type LoginResponse = AuthSession & { token: string };
export type FeriadoTipo = {
  id_tipo_feriado: number;
  nome_tipo: string;
};
export type Feriado = {
  id_feriado: number;
  data_feriado: string;
  descricao: string;
  fk_id_tipo_feriado: number;
  tipoFeriado: FeriadoTipo;
};
export type FeriadoPayload = {
  data_feriado: string;
  descricao: string;
  fk_id_tipo_feriado: number;
};
export type CursoApi = {
  id_cursos: number;
  nome_curso: string;
  carga_horaria: number;
  segmento: string;
  modalidade: string;
  dias_letivos_padrao: string | null;
  dias_remotos_padrao: string | null;
  codigo_turma_padrao: string | null;
  turno_padrao: string | null;
  id_instrutor_padrao: number | null;
  unidade: string | null;
};
export type InstrutorApi = {
  id_instrutores: number;
  nome_instrutor: string;
};
export type TipoSalaApi = {
  idTipo_sala: number;
  nome_tipo: string;
};
export type SalaApi = {
  id_salas: number;
  nome_sala: string;
  capacidade_maxima: number;
  idTipo_sala: number | null;
  local: string | null;
  recursos_especiais: string | null;
  tipoSala: TipoSalaApi | null;
};
export type TurmaApi = {
  id_turmas: number;
  id_cursos: number;
  id_instrutores: number | null;
  codigo_turma: string;
  data_inicio: string;
  data_termino: string | null;
  total_alunos: number;
  dias_semana: string;
  curso: {
    nome_curso: string;
    modalidade: string;
    unidade: string | null;
    dias_letivos_padrao: string | null;
    dias_remotos_padrao: string | null;
    curso_tem: boolean;
  };
  instrutor: { nome_instrutor: string } | null;
  turno: { nome_turno: string };
  agendamentos: Array<{ id_salas: number }>;
};

const TOKEN_KEY = 'sgst_auth_token';
export const AUTH_UNAUTHORIZED_EVENT = 'sgst:unauthorized';

export const authToken = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY)
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
});

api.interceptors.request.use(config => {
  const token = authToken.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const isLogin = error.config?.url === '/auth/login';
    if (error.response?.status === 401 && !isLogin && authToken.get()) {
      authToken.clear();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then(res => res.data),
  session: () => api.get<AuthSession>('/auth/me').then(res => res.data)
};

// Services para os CRUDs
export const CursoService = {
  getAll: () => api.get<CursoApi[]>('/cursos').then(res => res.data),
  create: (data: Record<string, unknown>) => api.post('/cursos', data).then(res => res.data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/cursos/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/cursos/${id}`).then(res => res.data),
};

export const SalaService = {
  getAll: () => api.get<SalaApi[]>('/salas').then(res => res.data),
  getTipos: () => api.get<TipoSalaApi[]>('/salas/tipos').then(res => res.data),
  create: (data: Record<string, unknown>) => api.post('/salas', data).then(res => res.data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/salas/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/salas/${id}`).then(res => res.data),
};

export const InstrutorService = {
  getAll: async () => {
    const res = await api.get<InstrutorApi[]>('/instrutores');
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/instrutores', data);
    return res.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await api.put(`/instrutores/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/instrutores/${id}`);
    return res.data;
  }
};

export const FeriadoService = {
  getAll: () => api.get<Feriado[]>('/feriados').then(res => res.data),
  getTypes: () => api.get<FeriadoTipo[]>('/feriados/tipos').then(res => res.data),
  create: (data: FeriadoPayload) => api.post<Feriado>('/feriados', data).then(res => res.data),
  update: (id: number, data: FeriadoPayload) =>
    api.put<Feriado>(`/feriados/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/feriados/${id}`)
};

export const CalculadoraService = {
  calcularCronograma: (data: { cargaHoraria: number; dataInicio: string; diasSemana: string[]; horasPorDia?: number }) => 
    api.post('/calcular_cronograma', data).then(res => res.data)
};

export const TurmaService = {
  getAll: () => api.get<TurmaApi[]>('/turmas').then(res => res.data),
  getDisponibilidade: (data: {
    id_cursos: number;
    data_inicio: string;
    fk_id_turno: number;
    total_alunos: number;
    dias_semana: string[];
    id_instrutores?: number | null;
    ignore_turma_id?: number;
  }) => api.post('/turmas/disponibilidade', data).then(res => res.data),
  alocar: (data: { id_cursos: number, id_salas: number, data_inicio: string, fk_id_turno: number, total_alunos: number, codigo_turma: string, dias_semana: string[], id_instrutores?: number | null }) =>
    api.post('/turmas/alocar', data).then(res => res.data),
  reallocar: (id: number, data: { id_salas: number, data_inicio: string, fk_id_turno: number, dias_semana: string[], id_instrutores?: number | null }) =>
    api.put(`/turmas/${id}/reallocar`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/turmas/${id}`).then(res => res.data),
  
  getAgendamentos: () => api.get('/turmas/agendamentos').then(res => res.data)
};
