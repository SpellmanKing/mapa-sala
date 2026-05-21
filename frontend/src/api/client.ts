import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
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
};

export const InstrutorService = {
  getAll: () => api.get('/instrutores').then(res => res.data),
};

export const CalculadoraService = {
  calcularCronograma: (data: { cargaHoraria: number, dataInicio: string, diasSemana: string[] }) => 
    api.post('/calcular_cronograma', data).then(res => res.data)
};

export const TurmaService = {
  alocar: (data: { id_cursos: number, id_salas: number, data_inicio: string, fk_id_turno: number, total_alunos: number, codigo_turma: string }) => 
    api.post('/turmas/alocar', data).then(res => res.data),
  
  getAgendamentos: () => api.get('/turmas/agendamentos').then(res => res.data)
};
