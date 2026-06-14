"use client";

import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal, toast,
} from "@/components/ui/index";
import { createParticipant, deleteParticipant, updateParticipant } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { useState, useMemo } from "react";

interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  _count: { predictions: number };
}

export function ParticipantsClient({ participants: initial }: { participants: Participant[] }) {
  const [participants, setParticipants] = useState(initial);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Participant | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};
    if (!formData.name.trim()) errors.name = "Nome obrigatório";
    if (!formData.email.trim()) errors.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email inválido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const p = await createParticipant(formData);
      setParticipants((prev) => [...prev, { ...p, _count: { predictions: 0 } }]);
      toast.success("Participante criado com sucesso");
      setShowCreate(false);
      setFormData({ name: "", email: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar participante");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTarget || !validateForm()) return;
    setLoading(true);
    try {
      const p = await updateParticipant(editTarget.id, formData);
      setParticipants((prev) => prev.map((x) => (x.id === editTarget.id ? { ...x, ...p } : x)));
      toast.success("Participante atualizado");
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteParticipant(deleteTarget);
      setParticipants((prev) => prev.filter((p) => p.id !== deleteTarget));
      toast.success("Participante removido");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao remover participante");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p: Participant) => {
    setEditTarget(p);
    setFormData({ name: p.name, email: p.email });
    setFormErrors({});
  };

  const openCreate = () => {
    setFormData({ name: "", email: "" });
    setFormErrors({});
    setShowCreate(true);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <Input
        label="Nome completo"
        value={formData.name}
        onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
        placeholder="João da Silva"
        error={formErrors.name}
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
        placeholder="joao@empresa.com.br"
        error={formErrors.email}
      />
    </div>
  );

  return (
    <>
      <Card padding={false}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5EDE0]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar participante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5EDE0] bg-[#F4F7F2] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#64C832]/30 focus:border-[#64C832] transition-all"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo Participante
          </Button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title={search ? "Nenhum resultado" : "Nenhum participante"}
            description={search ? "Tente outro termo" : "Adicione ou importe participantes"}
            action={!search ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Novo Participante</Button> : undefined}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFCF8] border-b border-[#E5EDE0]">
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-5 py-3.5">Nome</th>
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Email</th>
                <th className="text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Palpites</th>
                <th className="text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-3.5">Cadastro</th>
                <th className="text-right text-xs font-bold text-[#9CA3AF] uppercase tracking-wider px-5 py-3.5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#E5EDE0] last:border-0 hover:bg-[#FAFCF8] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F8DC] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#146E37]">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#1A1F16]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#9CA3AF]">{p.email}</td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="green">{p._count.predictions}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#9CA3AF]">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-[#E8F8DC] text-[#9CA3AF] hover:text-[#146E37] transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo Participante"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={loading}>Criar Participante</Button>
          </>
        }
      >
        <FormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Editar Participante"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} loading={loading}>Salvar Alterações</Button>
          </>
        }
      >
        <FormFields />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover Participante"
        description="Esta ação irá remover o participante e todos os seus palpites. Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        loading={loading}
      />
    </>
  );
}
