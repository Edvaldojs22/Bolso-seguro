import { useState } from "react";
import type { Ganhos, Gastos } from "../services/transacao/transacaoService";

interface UseTransactionModalProps {
  onSubmitSuccess: () => void;
}

export const useTransactionModal = ({
  onSubmitSuccess,
}: UseTransactionModalProps) => {
  const [modalAberto, setModalAberto] = useState<"gasto" | "ganho" | null>(
    null
  );
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<
    (Gastos & Ganhos) | null
  >(null);

  // Função para abrir o modal em modo edição
  const handleEditClick = (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => {
    setTransacaoEmEdicao(transacao as Gastos & Ganhos);
    setModalAberto(tipo);
  };

  // Função para fechar o modal e limpar o estado de edição
  const handleCloseModal = () => {
    setModalAberto(null);
    setTransacaoEmEdicao(null);
    onSubmitSuccess(); // Chama o callback para o dashboard atualizar, se necessário
  };

  return {
    modalAberto,
    setModalAberto, // Para abrir o modal em modo criação
    transacaoEmEdicao,
    setTransacaoEmEdicao, // Para limpar o estado antes de criar
    handleEditClick,
    handleCloseModal,
  };
};
