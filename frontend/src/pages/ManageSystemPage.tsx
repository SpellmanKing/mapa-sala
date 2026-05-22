import React, { useState } from 'react';
import { AllocationModal, CursoPayload } from '../components/AllocationModal';
import { InstrutorModal, InstrutorPayload } from '../components/InstrutorModal';
import { useAppContext, Curso, Instrutor } from '../context/AppContext';
import { CursoService, InstrutorService } from '../api/client';

type Tab = 'cursos' | 'instrutores' | 'salas';

export function ManageSystemPage() {
  const { cursos, instrutores, salas, tipoSalas, refreshCursos, refreshInstrutores } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('cursos');

  // --- Estados do Curso ---
  const [cursoModalOpen, setCursoModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [cursoForm, setCursoForm] = useState<CursoPayload>({
    nome: '', instrutorId: '', ambienteId: '', diasSemanaLetiva: ['1', '3', '5'], codigoTurmaPadrao: '', turnoPadrao: 'Manhã', modalidade: 'Presencial'
  });
  const [cursoError, setCursoError] = useState<string | null>(null);

  // --- Estados do Instrutor ---
  const [instrutorModalOpen, setInstrutorModalOpen] = useState(false);
  const [editingInstrutor, setEditingInstrutor] = useState<Instrutor | null>(null);
  const [instrutorForm, setInstrutorForm] = useState<InstrutorPayload>({ nome: '' });
  const [instrutorError, setInstrutorError] = useState<string | null>(null);

  // === MÉTODOS DE CURSO ===
  function openCursoCreate() {
    setEditingCurso(null);
    setCursoError(null);
    setCursoForm({ nome: '', instrutorId: instrutores[0]?.id ?? '', ambienteId: tipoSalas[0]?.id ?? '', diasSemanaLetiva: ['1', '3', '5'], codigoTurmaPadrao: '', turnoPadrao: 'Manhã', modalidade: 'Presencial' });
    setCursoModalOpen(true);
  }

  function openCursoEdit(curso: Curso) {
    setEditingCurso(curso);
    setCursoError(null);
    setCursoForm({ id: curso.id, nome: curso.nome, instrutorId: curso.instrutorId ?? '', ambienteId: curso.ambienteId ?? '', diasSemanaLetiva: curso.diasSemana ?? ['1', '3', '5'], codigoTurmaPadrao: curso.codigoTurmaPadrao ?? '', turnoPadrao: curso.turnoPadrao ?? 'Manhã', modalidade: curso.modalidade });
    setCursoModalOpen(true);
  }

  async function saveCurso() {
    if (!cursoForm.nome.trim()) return setCursoError('Nome é obrigatório.');
    if (!cursoForm.instrutorId) return setCursoError('Instrutor é obrigatório.');
    if (!cursoForm.ambienteId) return setCursoError('Ambiente é obrigatório.');

    try {
      const apiPayload = {
        nome_curso: cursoForm.nome,
        segmento: 'Geral',
        modalidade: cursoForm.modalidade,
        carga_horaria: 100,
        valor: 0,
        curso_tem: false,
        bolsa_compativel: true,
        idTipo_sala: Number(cursoForm.ambienteId) || undefined,
        id_instrutor_padrao: Number(cursoForm.instrutorId) || undefined,
        codigo_turma_padrao: cursoForm.codigoTurmaPadrao,
        turno_padrao: cursoForm.turnoPadrao,
        dias_letivos_padrao: cursoForm.diasSemanaLetiva.join(',')
      };

      if (editingCurso?.id) {
        await CursoService.update(Number(editingCurso.id), apiPayload);
      } else {
        await CursoService.create(apiPayload);
      }
      refreshCursos();
      setCursoModalOpen(false);
    } catch (err) {
      setCursoError('Erro ao salvar no backend.');
    }
  }

  async function removeCurso(id?: string) {
    if (!id || !window.confirm('Excluir este curso?')) return;
    try { await CursoService.delete(Number(id)); refreshCursos(); } catch { alert('Erro ao excluir.'); }
  }

  // === MÉTODOS DE INSTRUTOR ===
  function openInstrutorCreate() {
    setEditingInstrutor(null);
    setInstrutorError(null);
    setInstrutorForm({ nome: '' });
    setInstrutorModalOpen(true);
  }

  function openInstrutorEdit(instrutor: Instrutor) {
    setEditingInstrutor(instrutor);
    setInstrutorError(null);
    setInstrutorForm({ id: instrutor.id, nome: instrutor.nome });
    setInstrutorModalOpen(true);
  }

  async function saveInstrutor() {
    if (!instrutorForm.nome.trim()) return setInstrutorError('Nome é obrigatório.');

    try {
      const payload = { nome_instrutor: instrutorForm.nome };
      if (editingInstrutor?.id) {
        await InstrutorService.update(Number(editingInstrutor.id), payload);
      } else {
        await InstrutorService.create(payload);
      }
      refreshInstrutores();
      setInstrutorModalOpen(false);
    } catch (err) {
      setInstrutorError('Erro ao salvar no backend.');
    }
  }

  async function removeInstrutor(id?: string) {
    if (!id || !window.confirm('Excluir este instrutor?')) return;
    try { await InstrutorService.delete(Number(id)); refreshInstrutores(); } catch { alert('Erro ao excluir.'); }
  }

  // Helpers
  function getNomeInstrutor(id?: string) { return instrutores.find(i => i.id === id)?.nome ?? id ?? '-'; }
  function getNomeAmbiente(id?: string) { return tipoSalas.find(a => a.id === id)?.nome ?? id ?? '-'; }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Gerenciamento Educacional</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>Gestão unificada de Cursos, Instrutores e Salas.</p>
        </div>
        
        {activeTab === 'cursos' && (
          <button onClick={openCursoCreate} style={primaryButton}>Adicionar Curso</button>
        )}
        {activeTab === 'instrutores' && (
          <button onClick={openInstrutorCreate} style={primaryButton}>Adicionar Instrutor</button>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        <button onClick={() => setActiveTab('cursos')} style={activeTab === 'cursos' ? activeTabStyle : inactiveTabStyle}>Cursos</button>
        <button onClick={() => setActiveTab('instrutores')} style={activeTab === 'instrutores' ? activeTabStyle : inactiveTabStyle}>Instrutores</button>
        <button onClick={() => setActiveTab('salas')} style={activeTab === 'salas' ? activeTabStyle : inactiveTabStyle}>Salas e Ambientes</button>
      </div>

      <div style={{ marginTop: 18, overflowX: 'auto' }}>
        {activeTab === 'cursos' && (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>Nome do Curso</th>
                <th style={thStyle}>Instrutor Principal</th>
                <th style={thStyle}>Ambiente Sugerido</th>
                <th style={thStyle}>Modalidade</th>
                <th style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{c.nome}</td>
                  <td style={tdStyle}>{getNomeInstrutor(c.instrutorId)}</td>
                  <td style={tdStyle}>{getNomeAmbiente(c.ambienteId)}</td>
                  <td style={tdStyle}>{c.modalidade}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnSecondary} onClick={() => openCursoEdit(c)}>Editar</button>
                      <button style={btnDanger} onClick={() => removeCurso(c.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'instrutores' && (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nome do Instrutor</th>
                <th style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {instrutores.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>#{i.id}</td>
                  <td style={tdStyle}>{i.nome}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnSecondary} onClick={() => openInstrutorEdit(i)}>Editar</button>
                      <button style={btnDanger} onClick={() => removeInstrutor(i.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'salas' && (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nome do Ambiente</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Capacidade</th>
              </tr>
            </thead>
            <tbody>
              {salas.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>#{s.id}</td>
                  <td style={tdStyle}><b>{s.nome}</b></td>
                  <td style={tdStyle}>{s.tipo}</td>
                  <td style={tdStyle}>{s.capacidade} alunos</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AllocationModal
        open={cursoModalOpen}
        title={editingCurso ? 'Editar Curso' : 'Adicionar Curso'}
        error={cursoError}
        onClose={() => setCursoModalOpen(false)}
        onSave={saveCurso}
        form={cursoForm}
        setForm={setCursoForm}
        ambientes={tipoSalas}
        instrutores={instrutores}
      />

      <InstrutorModal
        open={instrutorModalOpen}
        title={editingInstrutor ? 'Editar Instrutor' : 'Adicionar Instrutor'}
        error={instrutorError}
        onClose={() => setInstrutorModalOpen(false)}
        onSave={saveInstrutor}
        form={instrutorForm}
        setForm={setInstrutorForm}
      />
    </div>
  );
}

const primaryButton: React.CSSProperties = { background: '#2563eb', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 600 };
const thStyle: React.CSSProperties = { padding: '12px 10px', textAlign: 'left', fontWeight: 600, fontSize: 14 };
const tdStyle: React.CSSProperties = { padding: '12px 10px', fontSize: 14 };
const btnSecondary: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', padding: '8px 10px', borderRadius: 10, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { background: '#ef4444', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 10, cursor: 'pointer' };

const activeTabStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '2px solid #2563eb', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 15 };
const inactiveTabStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#6b7280', fontWeight: 500, cursor: 'pointer', fontSize: 15 };
