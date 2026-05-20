import React, { useMemo, useState } from 'react';
import { AllocationModal } from '../components/AllocationModal';

type EnvironmentType = 'SALA' | 'LAB_INFO' | 'LAB_IMAGE' | 'AUDITORIO';

type EnvironmentItem = {
  id: string;
  nome: string;
  tipo: EnvironmentType;
};

type Instrutor = {
  id: string;
  nome: string;
};

type CursoPayload = {
  id?: string;
  nome: string;
  instrutorId: string;
  ambienteId: string;
  diasSemanaLetiva: string[]; // ['1'..'5']
  modalidade: 'Presencial' | 'Semi-Presencial' | 'Remoto';
};


type Curso = CursoPayload;

const SALAS: EnvironmentItem[] = [
  { id: 'sala-1', nome: 'Sala de Aula 1', tipo: 'SALA' },
  { id: 'sala-2', nome: 'Sala de Aula 2', tipo: 'SALA' },
  { id: 'sala-3', nome: 'Sala de Aula 3', tipo: 'SALA' },
  { id: 'sala-4', nome: 'Sala de Aula 4', tipo: 'SALA' },
  { id: 'sala-5', nome: 'Sala de Aula 5', tipo: 'SALA' },
  { id: 'sala-6', nome: 'Sala de Aula 6', tipo: 'SALA' }
];

const LABS_INFO: EnvironmentItem[] = [
  { id: 'lab-info-1', nome: 'Laboratório de Informática 1', tipo: 'LAB_INFO' },
  { id: 'lab-info-2', nome: 'Laboratório de Informática 2', tipo: 'LAB_INFO' },
  { id: 'lab-info-3', nome: 'Laboratório de Informática 3', tipo: 'LAB_INFO' }
];

const LABS_IMAGE: EnvironmentItem[] = [
  { id: 'lab-image-1', nome: 'Laboratório de Imagem 1', tipo: 'LAB_IMAGE' },
  { id: 'lab-image-2', nome: 'Laboratório de Imagem 2', tipo: 'LAB_IMAGE' },
  { id: 'lab-image-3', nome: 'Laboratório de Imagem 3', tipo: 'LAB_IMAGE' }
];

const AUDITORIO: EnvironmentItem[] = [{ id: 'auditorio', nome: 'Auditório', tipo: 'AUDITORIO' }];

const INSTRUTORES: Instrutor[] = [
  { id: 'lucas-esmeraldo', nome: 'Lucas Esmeraldo' },
  { id: 'lucas-dionisio', nome: 'Lucas Dionísio' },
  { id: 'kedna-medeiros', nome: 'Kedna Medeiros' },
  { id: 'diego-lohan', nome: 'Diego Lohan' },
  { id: 'jose-chaves', nome: 'José Chaves' },
  { id: 'jose-assis', nome: 'José de Assis' },
  { id: 'rosivane', nome: 'Rosivane' },
  { id: 'wellerson', nome: 'Wellerson' },
  { id: 'ricardo-pierre', nome: 'Ricardo Pierre' },
  { id: 'monica', nome: 'Mônica' },
  { id: 'dionisio', nome: 'Dionísio' },
  { id: 'david', nome: 'David' },
  { id: 'thiago', nome: 'Thiago' },
  { id: 'raquel', nome: 'Raquel' },
  { id: 'luzia', nome: 'Luzia' },
  { id: 'lunizeide', nome: 'Lunizeide' },
  { id: 'marileia', nome: 'Mariléia' },
  { id: 'flavia', nome: 'Flávia' },
  { id: 'shirliany', nome: 'Shirliany' },
  { id: 'nicole', nome: 'Nicole' },
  { id: 'fatima', nome: 'Fátima' },
  { id: 'bianca-mendes', nome: 'Bianca Mendes' }
];

function uid() {
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
}

function readCursos(): Curso[] {
  try {
    const raw = localStorage.getItem('sgst_cursos');
    if (!raw) return [];
    return JSON.parse(raw) as Curso[];
  } catch {
    return [];
  }
}

function writeCursos(cursos: Curso[]) {
  localStorage.setItem('sgst_cursos', JSON.stringify(cursos));
}

function getNomeInstrutor(id: string) {
  return INSTRUTORES.find(i => i.id === id)?.nome ?? '';
}

function getNomeAmbiente(id: string) {
  const all = [...SALAS, ...LABS_INFO, ...LABS_IMAGE, ...AUDITORIO];
  return all.find(a => a.id === id)?.nome ?? '';
}

export function ManageSystemPage() {
  const allAmbientes = useMemo(() => [...SALAS, ...LABS_INFO, ...LABS_IMAGE, ...AUDITORIO], []);

  const [cursos, setCursos] = useState<Curso[]>(() => readCursos());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);

  const [form, setForm] = useState<CursoPayload>({
    nome: '',
    instrutorId: INSTRUTORES[0]?.id ?? '',
    ambienteId: allAmbientes[0]?.id ?? '',
    diasSemanaLetiva: ['1', '3', '5'],
    modalidade: 'Presencial'
  });


  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      nome: '',
      instrutorId: INSTRUTORES[0]?.id ?? '',
      ambienteId: allAmbientes[0]?.id ?? '',
      diasSemanaLetiva: ['1', '3', '5'],
      modalidade: 'Presencial'
    });

    setModalOpen(true);
  }

  function openEdit(curso: Curso) {
    setEditing(curso);
    setError(null);
    setForm({
      id: curso.id,
      nome: curso.nome,
      instrutorId: curso.instrutorId,
      ambienteId: curso.ambienteId,
      diasSemanaLetiva: curso.diasSemanaLetiva,
      modalidade: curso.modalidade
    });

    setModalOpen(true);
  }

  function validate(payload: CursoPayload) {
    if (!payload.nome.trim()) return 'Nome do curso é obrigatório.';
    if (!payload.instrutorId) return 'Instrutor é obrigatório.';
    if (!payload.ambienteId) return 'Ambiente é obrigatório.';
    if (!payload.diasSemanaLetiva || payload.diasSemanaLetiva.length === 0) return 'Dias da semana letiva são obrigatórios.';
    if (!payload.modalidade) return 'Modalidade é obrigatória.';
    return null;
  }


  function save() {

    const v = validate(form);
    if (v) {
      setError(v);
      return;
    }

    if (editing?.id) {
      const updated = cursos.map(c => (c.id === editing.id ? { ...c, ...form, id: editing.id } : c));
      setCursos(updated);
      writeCursos(updated);
    } else {
      const novo: Curso = { ...form, id: uid() };
      const updated = [novo, ...cursos];
      setCursos(updated);
      writeCursos(updated);
    }

    setModalOpen(false);
  }

  function remove(id?: string) {
    if (!id) return;
    const ok = window.confirm('Excluir este curso?');
    if (!ok) return;

    const updated = cursos.filter(c => c.id !== id);
    setCursos(updated);
    writeCursos(updated);
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Gerenciamento Educacional</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>CRUD completo com modais e validação (localStorage).</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 10,
            cursor: 'pointer'
          }}
        >
          Adicionar Curso
        </button>
      </div>

      <div style={{ marginTop: 18, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={thStyle}>Nome do Curso</th>
              <th style={thStyle}>Instrutor</th>
              <th style={thStyle}>Ambiente</th>
              <th style={thStyle}>Dias da semana letiva</th>
              <th style={thStyle}>Modalidade</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {cursos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 18, textAlign: 'center', opacity: 0.8 }}>
                  Nenhum curso cadastrado.
                </td>
              </tr>
            ) : (
              cursos.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{c.nome}</td>
                  <td style={tdStyle}>{getNomeInstrutor(c.instrutorId)}</td>
                  <td style={tdStyle}>{getNomeAmbiente(c.ambienteId)}</td>
                  <td style={tdStyle}>{c.diasSemanaLetiva?.join(', ')}</td>
                  <td style={tdStyle}>{c.modalidade}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnSecondary} onClick={() => openEdit(c)}>
                        Editar
                      </button>
                      <button style={btnDanger} onClick={() => remove(c.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))

            )}
          </tbody>
        </table>
      </div>

      <AllocationModal
        open={modalOpen}
        title={editing ? 'Editar Curso' : 'Adicionar Curso'}
        error={error}
        onClose={() => setModalOpen(false)}
        onSave={save}
        form={form}
        setForm={setForm}
        ambientes={allAmbientes}
        instrutores={INSTRUTORES}
      />

      <div style={{ marginTop: 18, opacity: 0.7, fontSize: 12 }}>
        Dica: dados persistem em localStorage (chave <b>sgst_cursos</b>).
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 14
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  fontSize: 14
};

const btnSecondary: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d5db',
  padding: '8px 10px',
  borderRadius: 10,
  cursor: 'pointer'
};

const btnDanger: React.CSSProperties = {
  background: '#ef4444',
  color: 'white',
  border: 'none',
  padding: '8px 10px',
  borderRadius: 10,
  cursor: 'pointer'
};
