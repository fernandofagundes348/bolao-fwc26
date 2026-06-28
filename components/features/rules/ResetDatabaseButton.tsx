'use client';

import { useState, useTransition } from 'react';
import { resetDatabase } from '@/lib/actions';

export function ResetDatabaseButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    // Confirmação para evitar desastres
    const confirmed = window.confirm(
      "🚨 ATENÇÃO: Isso vai apagar TODOS os dados do bolão. Essa ação é IRREVERSÍVEL. Você tem certeza absoluta?"
    );

    if (!confirmed) return;

    startTransition(async () => {
      setError(null);
      const result = await resetDatabase();

      if (!result?.success) {
        setError(result?.error || 'Ocorreu um erro desconhecido.');
      } else {
        alert("Banco de dados resetado com sucesso!");
      }
    });
  };

  return (
    <div className="mt-12 p-6 border border-red-200 rounded-lg bg-red-50/50">
      <h3 className="text-red-700 font-semibold text-lg mb-1">
        Zona de Perigo
      </h3>
      <p className="text-sm text-red-600 mb-4">
        Esta ação apagará todas as pontuações e configurações. Uma vez executada, não pode ser desfeita.
      </p>
      
      <button
        onClick={handleReset}
        disabled={isPending}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Processando..." : "Resetar Banco de Dados"}
      </button>
      
      {error && (
        <p className="text-red-500 mt-3 text-sm font-medium">{error}</p>
      )}
    </div>
  );
}