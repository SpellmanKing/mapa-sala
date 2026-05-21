import React, { useState } from 'react';
import { AllocationModal, CursoPayload } from '../components/AllocationModal';
import { useAppContext, Curso } from '../context/AppContext';
import { CursoService } from '../api/client';

export function ManageSystemPage() {
  const { cursos, instrutores, salas, refreshCursos } = useAppContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);

  const [form, setForm] = useState<CursoPayload>({
    nome: '',
    instrutorId: '',
    ambienteId: '',
    diasSemanaLetiva: ['1', '3', '5'],
    modalidade: 'Presencial'
  });

  const [error, setError] = useState<string | null>(null);

  function getNomeInstrutor(id?: string) {
    if (!id) return '-';
    return instrutores.find(i => i.id === id)?.nome ?? id;
  }

  function getNomeAmbiente(id?: string) {
    if (!id) return '-';
    return salas.find(a => a.id === id)?.nome ?? id;
  }

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      nome: '',
      instrutorId: instrutores[0]?.id ?? '',
      ambienteId: salas[0]?.id ?? '',
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
      instrutorId: curso.instrutorId ?? '',
      ambienteId: curso.ambienteId ?? '',
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

  async function save() {
    const v = validate(form);
    if (v) {
      setError(v);
      return;
    }

    try {
      const apiPayload = {
        nome_curso: form.nome,
        segmento: 'Geral', // Pode virar campo
        modalidade: form.modalidade,
        carga_horaria: 100, // Pode virar campo
        valor: 0,
        curso_tem: false,
        bolsa_compativel: true,
        idTipo_sala: Number(form.ambienteId) || undefined
      };

      if (editing?.id) {
        await CursoService.update(Number(editing.id), apiPayload);
      } else {
        await CursoService.create(apiPayload);
      }

      refreshCursos();
      setModalOpen(false);
    } catch (err: any) {
      setError('Erro ao salvar no backend.');
      console.error(err);
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    const ok = window.confirm('Excluir este curso?');
    if (!ok) return;

    try {
      await CursoService.delete(Number(id));
      refreshCursos();
    } catch (err) {
      console.error('Erro ao excluir', err);
      alert('Não foi possível excluir.');
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Gerenciamento Educacional</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>Integração direta com o Banco de Dados (API).</p>
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
              <th style={thStyle}>Ambiente (Sala)</th>
              <th style={thStyle}>Dias letivos</th>
              <th style={thStyle}>Modalidade</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {cursos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: 'center', opacity: 0.8 }}>
                  Nenhum curso cadastrado.
                </td>
              </tr>
            ) : (
              cursos.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{c.nome}</td>
                  <td style={tdStyle}>{getNomeInstrutor(c.instrutorId)}</td>
                  <td style={tdStyle}>{getNomeAmbiente(c.ambienteId)}</td>
                  <td style={tdStyle}>{c.diasSemana?.join(', ')}</td>
                  <td style={tdStyle}>{c.modalidade}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnSecondary} onClick={() => openEdit(c)}>Editar</button>
                      <button style={btnDanger} onClick={() => remove(c.id)}>Excluir</button>
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
        ambientes={salas}
        instrutores={instrutores}
      />
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '12px 10px', textAlign: 'left', fontWeight: 600, fontSize: 14 };
const tdStyle: React.CSSProperties = { padding: '12px 10px', fontSize: 14 };
const btnSecondary: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', padding: '8px 10px', borderRadius: 10, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { background: '#ef4444', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 10, cursor: 'pointer' };
