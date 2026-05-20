import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

const DIAS = [
  { id: '1', label: 'Segunda' },
  { id: '2', label: 'Terça' },
  { id: '3', label: 'Quarta' },
  { id: '4', label: 'Quinta' },
  { id: '5', label: 'Sexta' },
];

export function CalculadoraPage() {
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [modalidade, setModalidade] = useState('Presencial');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [resultado, setResultado] = useState<{
    dataTermino: string;
    diasCorridos: number;
    totalAulas: number;
  } | null>(null);

  const handleDiaToggle = (id: string) => {
    setDiasSelecionados(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const calcular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargaHoraria || diasSelecionados.length === 0 || !dataInicio) return;

    const hours = parseInt(cargaHoraria);
    const classesNeeded = Math.ceil(hours / 4); // 4h por dia letivo

    let currentDate = new Date(dataInicio);
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

    let classesScheduled = 0;

    while (classesScheduled < classesNeeded) {
      const dayOfWeek = currentDate.getDay().toString();
      if (diasSelecionados.includes(dayOfWeek)) {
        classesScheduled++;
      }
      if (classesScheduled < classesNeeded) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const start = new Date(dataInicio);
    start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
    const diffTime = Math.abs(currentDate.getTime() - start.getTime());
    const diasCorridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setResultado({
      dataTermino: currentDate.toISOString().split('T')[0],
      diasCorridos,
      totalAulas: classesNeeded
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={22} style={{ color: '#2563eb' }} /> Calculadora de Cronograma
        </h1>
        <p style={{ margin: '6px 0 0', opacity: 0.8 }}>
          Estime a data exata de término do curso com base na carga horária e dias letivos.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
        {/* FORMULÁRIO */}
        <form onSubmit={calcular} style={{
          flex: 1,
          minWidth: 320,
          background: 'white',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          padding: 24
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            Parâmetros de Cálculo
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Carga Horária (horas)</label>
            <input
              type="number"
              value={cargaHoraria}
              onChange={e => setCargaHoraria(e.target.value)}
              placeholder="Ex: 800"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Modalidade</label>
            <select
              value={modalidade}
              onChange={e => setModalidade(e.target.value)}
              style={inputStyle}
            >
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Dias da Semana Letivos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DIAS.map(dia => (
                <label key={dia.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  border: diasSelecionados.includes(dia.id) ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: diasSelecionados.includes(dia.id) ? '#eff6ff' : 'white',
                  fontSize: 13,
                  fontWeight: 500
                }}>
                  <input
                    type="checkbox"
                    checked={diasSelecionados.includes(dia.id)}
                    onChange={() => handleDiaToggle(dia.id)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  {dia.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Data de Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 0',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            Gerar Cronograma
          </button>
        </form>

        {/* RESULTADO */}
        <div style={{
          flex: 1,
          minWidth: 320,
          background: 'white',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            Projeção de Término
          </h2>

          {resultado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#eff6ff',
                borderRadius: 12,
                border: '1px solid #dbeafe',
                padding: 20,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Data de Término Estimada
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', marginTop: 4 }}>
                  {new Date(resultado.dataTermino + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Aulas Projetadas</div>
                  <div style={{ ...cardValueStyle, color: '#f59e0b' }}>{resultado.totalAulas}</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Duração Bruta</div>
                  <div style={cardValueStyle}>{resultado.diasCorridos} dias</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Carga Horária</div>
                  <div style={cardValueStyle}>{cargaHoraria}h</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Modalidade</div>
                  <div style={{ ...cardValueStyle, color: modalidade === 'Remoto' ? '#f59e0b' : '#2563eb' }}>{modalidade}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              opacity: 0.3,
              padding: 40
            }}>
              <Calculator size={48} />
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                Preencha os parâmetros e clique em "Gerar Cronograma" para ver a projeção.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box'
};

const cardStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: 10,
  border: '1px solid #f3f4f6',
  padding: 14,
  textAlign: 'center'
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.5
};

const cardValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: '#374151',
  marginTop: 2
};
