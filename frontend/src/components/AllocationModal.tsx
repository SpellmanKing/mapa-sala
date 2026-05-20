import React, { useEffect, useMemo } from 'react';

type EnvironmentType = 'SALA' | 'LAB_INFO' | 'LAB_IMAGE' | 'AUDITORIO';

export type EnvironmentItem = {
  id: string;
  nome: string;
  tipo: EnvironmentType;
};

export type Instrutor = {
  id: string;
  nome: string;
};

export type CursoPayload = {
  id?: string;
  nome: string;
  instrutorId: string;
  ambienteId: string;
};

type Props = {
  open: boolean;
  title: string;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  form: CursoPayload;
  setForm: React.Dispatch<React.SetStateAction<CursoPayload>>;
  ambientes: EnvironmentItem[];
  instrutores: Instrutor[];
};

export function AllocationModal({
  open,
  title,
  error,
  onClose,
  onSave,
  form,
  setForm,
  ambientes,
  instrutores
}: Props) {
  const ambientesSorted = useMemo(() => [...ambientes].sort((a, b) => a.nome.localeCompare(b.nome)), [ambientes]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSave();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onSave]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50
      }}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 20px 70px rgba(0,0,0,0.28)',
          padding: 18
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: 13 }}>
              Campos obrigatórios: nome do curso, instrutor e ambiente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: '22px',
              padding: '0 6px'
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Nome do Curso
            </label>
            <input
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Desenvolvimento Web"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Instrutor
            </label>
            <select
              value={form.instrutorId}
              onChange={(e) => setForm((prev) => ({ ...prev, instrutorId: e.target.value }))}
              style={inputStyle}
            >
              {instrutores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Ambiente
            </label>
            <select
              value={form.ambienteId}
              onChange={(e) => setForm((prev) => ({ ...prev, ambienteId: e.target.value }))}
              style={inputStyle}
            >
              {ambientesSorted.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 12 }}>
            <p style={{ margin: 0, color: '#991b1b', fontWeight: 600, fontSize: 13 }}>{error}</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="button" onClick={onSave} style={primaryButtonStyle}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  outline: 'none',
  fontSize: 14
};

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  background: '#2563eb',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 700
};

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  background: 'white',
  padding: '10px 14px',
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 700
};
