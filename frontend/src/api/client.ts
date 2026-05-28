import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Services para os CRUDs
export const CursoService = {
  getAll: () => api.get('/cursos').then(res => res.data),
  create: (data: any) => api.post('/cursos', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/cursos/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/cursos/${id}`).then(res => res.data),
};

export const SalaService = {
  getAll: () => api.get('/salas').then(res => res.data),
  getTipos: () => api.get('/salas/tipos').then(res => res.data),
};

export const InstrutorService = {
  getAll: async () => {
    const res = await api.get('/instrutores');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/instrutores', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/instrutores/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/instrutores/${id}`);
    return res.data;
  }
};

export const CalculadoraService = {
  calcularCronograma: (data: { cargaHoraria: number, dataInicio: string, diasSemana: string[] }) => 
    api.post('/calcular_cronograma', data).then(res => res.data)
};

export const TurmaService = {
  getAll: () => api.get('/turmas').then(res => res.data),
  alocar: (data: { id_cursos: number, id_salas: number, data_inicio: string, fk_id_turno: number, total_alunos: number, codigo_turma: string, dias_semana: string[] }) => 
    api.post('/turmas/alocar', data).then(res => res.data),
  reallocar: (id: number, data: { id_salas: number, data_inicio: string, fk_id_turno: number, dias_semana: string[] }) =>
    api.put(`/turmas/${id}/reallocar`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/turmas/${id}`).then(res => res.data),
  
  getAgendamentos: () => api.get('/turmas/agendamentos').then(res => res.data)
};
