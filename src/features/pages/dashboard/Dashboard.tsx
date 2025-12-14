// Importações dos Componentes de UI
import { useState } from "react";
import useDashboardData from "../../hooks/useTransactionModal";
import DashboardSummary from "./components/DashboardSummary";
import TransactionActions from "./components/TransactionActions";
import TransactionSection from "./components/TransactionSection";
import { useTransactionModal } from "../../hooks/userTransactionModal";
import TransacaoForm from "../../components/TransacaoForm";
import type { Ganhos, Gasto } from "../../services/transacao/transacaoService";
import AppModal from "../../components/AppModal";

export type GastoFormData = Omit<Gasto, "userId" | "fechado">;
export type GanhoFormData = Omit<Ganhos, "userId" | "fechado" | "id">;
type TransacaoFormData = GastoFormData | GanhoFormData;

export default function Dashboard() {
  // 1. LÓGICA PRINCIPAL E DADOS
  const {
    loading,
    gastos,
    ganhos,
    hasMoreGastos,
    hasMoreGanhos,
    // lastDocGasto, // Não é mais usado aqui, mas é retornado pelo hook
    // lastDocGanho, // Não é mais usado aqui, mas é retornado pelo hook
    totalGastosFechado,
    totalGanhosFechado,
    saldoFechado,
    isClosing,
    handleFecharPeriodo,
    handleSubmit: handleDataSubmit,
    handleDelete,
    // fetchTransacoes, // Não é mais usado diretamente aqui
    handleLoadMore,
  } = useDashboardData();

  // 2. ESTADO DE VISUALIZAÇÃO DA LISTA
  const [view, setView] = useState<"gasto" | "ganho">("gasto");

  // 3. LÓGICA DO MODAL
  const {
    modalAberto,
    setModalAberto,
    transacaoEmEdicao,
    setTransacaoEmEdicao,
    handleEditClick,
    handleCloseModal: closeModalInternal,
  } = useTransactionModal({
    // Mantendo o callback, embora o handleDataSubmit já faça o refresh
    onSubmitSuccess: () => {
      // Nada é necessário aqui se handleDataSubmit no hook já recarrega.
    },
  });

  // 4. FUNÇÃO UNIFICADA DE SUBMISSÃO (Chama o hook e fecha o modal)
  async function handleSubmit(data: TransacaoFormData, id?: string) {
    // Chama a função de serviço do useDashboardData
    // Garantir que modalAberto não é null antes de passar
    if (!modalAberto) return;

    const result = await handleDataSubmit(data, modalAberto, id);

    // Se a submissão foi bem-sucedida, fechamos o modal.
    if (result && result.success) {
      closeModalInternal(); // Fecha e limpa o estado de edição
    }
  }

  if (loading) {
    return (
      <p className="text-center p-8 text-gray-600">
        Carregando dados financeiros...
      </p>
    );
  }

  // 5. ESTRUTURA E RENDERIZAÇÃO
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <h1 className="text-[26px] font-extrabold text-gray-900 mb-8 border-b pb-2">
        Dashboard Financeiro
      </h1>

      <p className="font-bold text-blue-500 text-center">
        Relatório Atual de (
        {new Date().toLocaleDateString("pt-BR", { month: "long" })})
      </p>

      {/* RESUMO E FECHAMENTO */}
      <DashboardSummary
        totalGastos={totalGastosFechado}
        totalGanhos={totalGanhosFechado}
        saldo={saldoFechado}
        onClosePeriod={handleFecharPeriodo}
        isClosing={isClosing}
      />

      {/* AÇÕES DE CRIAÇÃO */}
      <TransactionActions
        onOpenGasto={() => {
          setTransacaoEmEdicao(null);
          setModalAberto("gasto");
        }}
        onOpenGanho={() => {
          setTransacaoEmEdicao(null);
          setModalAberto("ganho");
        }}
      />

      {/* SEÇÃO DE LISTAGEM E PAGINAÇÃO */}
      <TransactionSection
        view={view}
        setView={setView}
        gastos={gastos}
        ganhos={ganhos}
        hasMoreGastos={hasMoreGastos}
        hasMoreGanhos={hasMoreGanhos}
        onLoadMore={handleLoadMore}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      {/* 🚨 CORREÇÃO 3: Usar o AppModal wrapper e o handler de fechar */}
      {modalAberto && (
        <AppModal isOpen={!!modalAberto} onClose={closeModalInternal}>
          <TransacaoForm
            tipo={modalAberto}
            onSubmit={handleSubmit}
            initialData={transacaoEmEdicao}
          />
        </AppModal>
      )}
    </div>
  );
}
