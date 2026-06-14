"use client";

import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal, toast,
} from "@/components/ui/index";
import { createMatch, deleteMatch, setMatchResult, updateMatch } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2, Edit2, Gamepad2, Plus, Search, Trophy, Trash2
} from "lucide-react";
import { useState, useMemo } from "react";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
  round: string | null;
  officialResult: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
  _count: { predictions: number };
}

interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  round: string;
}

const DEFAULT_FORM: MatchFormData = {
  homeTeam: "",
  awayTeam: "",
  matchDate: "",
  round: "",
};

export function MatchesClient({ matches: initial }: { matches: Match[] }) {
  const [matches, setMatches] = useState(initial);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Match | null>(null);
  const [resultTarget, setResultTarget] = useState<Match | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<MatchFormData>(DEFAULT_FORM);
  const [resultInput, setResultInput] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<MatchFormData>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return matches;
    const q = search.toLowerCase();
    return matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.round?.toLowerCase().includes(q)
    );
  }, [matches, search]);

  const validateForm = () => {
    const errors: Partial<MatchFormData> = {};
    if (!form.homeTeam.trim()) errors.homeTeam = "Obrigatório";
    if (!form.awayTeam.trim()) errors.awayTeam = "Obrigatório";
    if (!form.matchDate) errors.matchDate = "Obrigatório";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const m = await createMatch(form);
      setMatches((prev) => [...prev, { ...m, _count: { predictions: 0 } }]);
      toast.success("Jogo criado com sucesso");
      setShowCreate(false);
      setForm(DEFAULT_FORM);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar jogo");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTarget || !validateForm()) return;
    setLoading(true);
    try {
      const m = await updateMatch(editTarget.id, form);
      setMatches((prev) => prev.map((x) => (x.id === editTarget.id ? { ...x, ...m } : x)));
      toast.success("Jogo atualizado");
      setEditTarget(null);
    } catch {
      toast.error("Erro ao atualizar jogo");
    } finally {
      setLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (!resultTarget || !resultInput.trim()) return;
    if (!/^\d+[x\-:]\d+$/i.test(resultInput.trim())) {
      toast.error("Formato inválido. Use: 2x1, 1-0 ou 1:0");
      return;
    }
    setLoading(true);
    try {
      const m = await setMatchResult(resultTarget.id, resultInput.trim());
      setMatches((prev) =>
        prev.map((x) => (x.id === resultTarget.id ? { ...x, ...m } : x))
      );
      toast.success("Resultado registrado — pontuações recalculadas");
      setResultTarget(null);
      setResultInput("");
    } catch {
      toast.error("Erro ao registrar resultado");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteMatch(deleteTarget);
      setMatches((prev) => prev.filter((m) => m.id !== deleteTarget));
      toast.success("Jogo removido");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao remover jogo");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (m: Match) => {
    setEditTarget(m);
    setForm({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: new Date(m.matchDate).toISOString().slice(0, 16),
      round: m.round ?? "",
    });
    setFormErrors({});
  };

  const MatchForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Time da Casa"
          value={form.homeTeam}
          onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))}
          placeholder="Brasil"
          error={formErrors.homeTeam}
        />
        <Input
          label="Time Visitante"
          value={form.awayTeam}
          onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))}
          placeholder="Argentina"
          error={formErrors.awayTeam}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data e Hora"
          type="datetime-local"
          value={form.matchDate}
          onChange={(e) => setForm((f) => ({ ...f, matchDate: e.target.value }))}
          error={formErrors.matchDate}
        />
        <Input
          label="Rodada (opcional)"
          value={form.round}
          onChange={(e) => setForm((f) => ({ ...f, round: e.target.value }))}
          placeholder="Fase de Grupos — A"
        />
      </div>
    </div>
  );

  const statusMap = {
    SCHEDULED: { label: "Agendado", variant: "gray" as const },
    IN_PROGRESS: { label: "Em Andamento", variant: "yellow" as const },
    FINISHED: { label: "Finalizado", variant: "green" as const },
  };

  return (
    <>
      <Card padding={false}>
        <div className="flex items-center justify-between p-5 border-b border-[#E5EDE0]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar jogo ou rodada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5EDE0] bg-[#F4F7F2] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setForm(DEFAULT_FORM);
              setFormErrors({});
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Jogo
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 className="h-7 w-7" />}
            title="Nenhum jogo cadastrado"
            description="Adicione os jogos do bolão para começar"
            action={
              <Button size="sm" onClick={() => { setForm(DEFAULT_FORM); setShowCreate(true); }}>
                <Plus className="h-4 w-4" />
                Novo Jogo
              </Button>
            }
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFCF8] border-b border-[#E5EDE0]">
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-5 py-3.5">Jogo</th>
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Rodada</th>
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Data</th>
                <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Resultado</th>
                <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Palpites</th>
                <th className="text-right text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-5 py-3.5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const status = statusMap[m.status];
                return (
                  <tr key={m.id} className="border-b border-[#E5EDE0] last:border-0 hover:bg-[#FAFCF8] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#1A1F16]">
                        {m.homeTeam} <span className="text-[#9CA3AF] font-normal">×</span> {m.awayTeam}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#9CA3AF]">{m.round ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-[#9CA3AF]">{formatDate(m.matchDate)}</td>
                    <td className="px-4 py-4 text-center">
                      {m.officialResult ? (
                        <span className="text-base font-bold text-[#146E37]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          {m.officialResult}
                        </span>
                      ) : (
                        <button
                          onClick={() => { setResultTarget(m); setResultInput(""); }}
                          className="text-xs font-semibold text-[#64C832] hover:text-[#146E37] underline underline-offset-2 transition-colors"
                        >
                          Registrar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="gray">{m._count.predictions}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!m.officialResult && (
                          <button
                            onClick={() => { setResultTarget(m); setResultInput(""); }}
                            className="p-2 rounded-lg hover:bg-[#E8F8DC] text-[#9CA3AF] hover:text-[#146E37] transition-colors"
                            title="Registrar resultado"
                          >
                            <Trophy className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 rounded-lg hover:bg-[#E8F8DC] text-[#9CA3AF] hover:text-[#146E37] transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Jogo" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={loading}>Criar Jogo</Button>
          </>
        }
      >
        <MatchForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Jogo" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} loading={loading}>Salvar</Button>
          </>
        }
      >
        <MatchForm />
      </Modal>

      {/* Result Modal */}
      <Modal open={!!resultTarget} onClose={() => setResultTarget(null)} title="Registrar Resultado" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResultTarget(null)}>Cancelar</Button>
            <Button onClick={handleSetResult} loading={loading}>
              <CheckCircle2 className="h-4 w-4" />
              Registrar
            </Button>
          </>
        }
      >
        {resultTarget && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#F4F7F2] text-center">
              <p className="text-sm font-bold text-[#1A1F16]">
                {resultTarget.homeTeam} × {resultTarget.awayTeam}
              </p>
            </div>
            <Input
              label="Resultado oficial"
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              placeholder="Ex: 2x1, 1-0, 3:2"
            />
            <p className="text-xs text-[#9CA3AF]">
              Ao confirmar, todos os palpites relacionados serão recalculados automaticamente.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover Jogo"
        description="Esta ação irá remover o jogo e todos os palpites associados. Não pode ser desfeita."
        confirmLabel="Remover"
        loading={loading}
      />
    </>
  );
}
