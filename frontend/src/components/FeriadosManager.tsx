import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Edit, Filter, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import {
  FeriadoService,
  type Feriado,
  type FeriadoPayload,
  type FeriadoTipo
} from '../api/client';
import { useAppUi } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { FeriadoModal, type FeriadoForm } from './FeriadoModal';

const emptyForm: FeriadoForm = {
  data_feriado: '',
  descricao: '',
  fk_id_tipo_feriado: ''
};

const dateOnly = (value: string) => value.split('T')[0] ?? '';
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${dateOnly(value)}T12:00:00Z`));

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export function FeriadosManager() {
  const { showToast } = useAppUi();
  const { can } = useAuth();
  const canManage = can('MANAGE');
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [tipos, setTipos] = useState<FeriadoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feriado | null>(null);
  const [form, setForm] = useState<FeriadoForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Feriado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [items, availableTypes] = await Promise.all([
        FeriadoService.getAll(),
        FeriadoService.getTypes()
      ]);
      setFeriados(items);
      setTipos(availableTypes);
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível carregar feriados e recessos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return feriados.filter(item => {
      const itemDate = dateOnly(item.data_feriado);
      const matchesText = !term ||
        item.descricao.toLocaleLowerCase('pt-BR').includes(term) ||
        item.tipoFeriado.nome_tipo.toLocaleLowerCase('pt-BR').includes(term);
      return matchesText &&
        (typeFilter === 'Todos' || String(item.fk_id_tipo_feriado) === typeFilter) &&
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate);
    });
  }, [feriados, search, typeFilter, startDate, endDate]);

  const hasFilters = Boolean(search || startDate || endDate || typeFilter !== 'Todos');

  const openCreate = () => {
    if (!canManage) return;
    setEditing(null);
    setForm({ ...emptyForm, fk_id_tipo_feriado: String(tipos[0]?.id_tipo_feriado ?? '') });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Feriado) => {
    if (!canManage) return;
    setEditing(item);
    setForm({
      data_feriado: dateOnly(item.data_feriado),
      descricao: item.descricao,
      fk_id_tipo_feriado: String(item.fk_id_tipo_feriado)
    });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    const description = form.descricao.trim();
    const typeId = Number(form.fk_id_tipo_feriado);
    if (!form.data_feriado) return setFormError('Data é obrigatória.');
    if (Number.isNaN(new Date(`${form.data_feriado}T00:00:00Z`).getTime())) return setFormError('Data inválida.');
    if (!description) return setFormError('Descrição é obrigatória.');
    if (!Number.isInteger(typeId) || typeId <= 0 || !tipos.some(type => type.id_tipo_feriado === typeId)) {
      return setFormError('Selecione um tipo válido.');
    }
    if (feriados.some(item => item.id_feriado !== editing?.id_feriado && dateOnly(item.data_feriado) === form.data_feriado)) {
      return setFormError('Já existe um feriado ou recesso cadastrado nesta data.');
    }

    const payload: FeriadoPayload = {
      data_feriado: form.data_feriado,
      descricao: description,
      fk_id_tipo_feriado: typeId
    };
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await FeriadoService.update(editing.id_feriado, payload)
        : await FeriadoService.create(payload);
      if (editing) {
        showToast('Feriado atualizado com sucesso!', 'success');
      } else {
        showToast('Feriado criado com sucesso!', 'success');
      }
      setFeriados(previous => [
        ...previous.filter(item => item.id_feriado !== saved.id_feriado),
        saved
      ].sort((a, b) => a.data_feriado.localeCompare(b.data_feriado)));
      setModalOpen(false);
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível salvar o feriado.');
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || !canManage) return;
    setIsDeleting(true);
    try {
      await FeriadoService.delete(deleting.id_feriado);
      setFeriados(previous => previous.filter(item => item.id_feriado !== deleting.id_feriado));
      showToast('Feriado excluído com sucesso!', 'success');
      setDeleting(null);
    } catch (error) {
      showToast(errorMessage(error, 'Não foi possível excluir o feriado.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('Todos');
    setStartDate('');
    setEndDate('');
  };

  return (
    <section className="flex flex-col gap-5" aria-labelledby="feriados-title">
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="feriados-title" className="flex items-center gap-2 text-base font-black text-text-main">
            <CalendarDays className="h-5 w-5 text-primary" />
            Feriados e recessos
          </h2>
          <p className="mt-1 text-xs font-medium text-text-muted">
            Todas as datas cadastradas impactam a calculadora e são ignoradas na geração de cronogramas.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            disabled={loading || tipos.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white shadow-md hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus size={16} /> Adicionar feriado
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto_auto] lg:items-end">
          <div>
            <label htmlFor="search-feriado" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Buscar</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3">
              <Search size={15} className="text-text-muted" />
              <input
                id="search-feriado"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Descrição ou tipo..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-text-main outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tipo-feriado-filter" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Tipo</label>
            <select
              id="tipo-feriado-filter"
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm font-semibold text-text-main outline-none lg:w-44"
            >
              <option value="Todos">Todos</option>
              {tipos.map(tipo => <option key={tipo.id_tipo_feriado} value={tipo.id_tipo_feriado}>{tipo.nome_tipo}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="inicio-feriado-filter" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">De</label>
            <input id="inicio-feriado-filter" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-text-main outline-none" />
          </div>
          <div>
            <label htmlFor="fim-feriado-filter" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Até</label>
            <input id="fim-feriado-filter" type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-text-main outline-none" />
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-text-muted hover:bg-surface hover:text-text-main">
              <X size={14} /> Limpar
            </button>
          )}
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-primary" aria-live="polite">
            <Filter size={13} /> {filtered.length} resultado{filtered.length === 1 ? '' : 's'} com filtros ativos
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-bold text-text-muted">
          <Loader2 className="animate-spin" size={18} /> Carregando feriados...
        </div>
      ) : loadError ? (
        <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{loadError}</p>
          <button type="button" onClick={() => void load()} className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white">Tentar novamente</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <CalendarDays className="mb-3 h-9 w-9 text-text-muted/50" />
          <p className="text-sm font-black text-text-main">{hasFilters ? 'Nenhum resultado encontrado' : 'Nenhum feriado cadastrado'}</p>
          <p className="mt-1 text-xs text-text-muted">{hasFilters ? 'Ajuste ou limpe os filtros.' : 'Os cronogramas ainda não possuem datas de exceção.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(item => (
            <article key={item.id_feriado} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <time dateTime={dateOnly(item.data_feriado)} className="text-lg font-black text-text-main">{formatDate(item.data_feriado)}</time>
                  <h3 className="mt-1 truncate text-sm font-bold text-text-main" title={item.descricao}>{item.descricao}</h3>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" aria-label={`Editar ${item.descricao}`} onClick={() => openEdit(item)} className="rounded-lg p-2 text-text-muted hover:bg-primary/10 hover:text-primary"><Edit size={15} /></button>
                    <button type="button" aria-label={`Excluir ${item.descricao}`} onClick={() => setDeleting(item)} className="rounded-lg p-2 text-text-muted hover:bg-red-500/10 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-muted">{item.tipoFeriado.nome_tipo}</span>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">Impacta cronogramas</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <FeriadoModal
        open={modalOpen}
        title={editing ? 'Editar feriado ou recesso' : 'Adicionar feriado ou recesso'}
        error={formError}
        form={form}
        tipos={tipos}
        isSaving={saving}
        setForm={setForm}
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Excluir feriado"
        itemName={deleting?.descricao ?? ''}
        itemType="feriado"
        onConfirm={() => void confirmDelete()}
        onClose={() => !isDeleting && setDeleting(null)}
        isDeleting={isDeleting}
      />
    </section>
  );
}
