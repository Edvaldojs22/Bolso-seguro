import { useCallback, useEffect, useState } from "react";
import {
  buscaGanhosPorUsuario,
  buscaGastosPorUsuario,
  criarGanho,
  criarGasto,
  deletarGanho,
  deletarGasto,
  editarGanho,
  editarGasto,
  type Ganhos,
  type Gastos,
} from "../services/transacao/transacaoService";
import { useAuth } from "../auth/AuthProvider";
import {
  buscaUltimoFechamento,
  fecharPeriodo,
  type Fechamento,
} from "../services/fechamento/fechamentoService";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type {
  GanhoFormData,
  GastoFormData,
} from "../pages/dashboard/Dashboard";

type TransacaoFormData = GastoFormData | GanhoFormData;

const useDashboardData = () => {
  const { user, loading } = useAuth();
  const [gastos, setGastos] = useState<Gastos[]>([]);
  const [ganhos, setGanhos] = useState<Ganhos[]>([]);

  // Estados do Fechamento
  const [ultimoFechamento, setUltimoFechamento] = useState<Fechamento | null>(
    null
  );
  const [isClosing, setIsClosing] = useState(false);

  // Estados de Paginação
  const [lastDocGasto, setLastDocGasto] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDocGanho, setLastDocGanho] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreGastos, setHasMoreGastos] = useState(true);
  const [hasMoreGanhos, setHasMoreGanhos] = useState(true);

  // --- FUNÇÕES DE BUSCA ---
  const fetchUltimoFechamento = useCallback(async () => {
    if (!user) return;
    try {
      const fechamento = await buscaUltimoFechamento(user.uid);
      setUltimoFechamento(fechamento);
    } catch (error) {
      console.error("Erro ao buscar último fechamento:", error);
    }
  }, [user]);

  const fetchTransacoes = useCallback(
    async (
      tipo: "gasto" | "ganho",
      lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
      reset = false // Adiciona flag para recarregar do zero
    ) => {
      if (!user) return;

      try {
        const docParaPassar = lastDoc === null ? undefined : lastDoc;

        if (tipo === "gasto") {
          const { gastos: novosGastos, lastDoc: novoLastDoc } =
            await buscaGastosPorUsuario(user.uid, docParaPassar);

          setGastos((prev) =>
            reset || !lastDoc ? novosGastos : [...prev, ...novosGastos]
          );
          setLastDocGasto(novoLastDoc);
          setHasMoreGastos(novosGastos.length === 10);
        } else {
          const { ganhos: novosGanhos, lastDoc: novoLastDoc } =
            await buscaGanhosPorUsuario(user.uid, docParaPassar);

          setGanhos((prev) =>
            reset || !lastDoc ? novosGanhos : [...prev, ...novosGanhos]
          );
          setLastDocGanho(novoLastDoc);
          setHasMoreGanhos(novosGanhos.length === 10);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${tipo}:`, error);
      }
    },
    [user]
  );

  // --- LÓGICA DE CRUD ---
  const handleDelete = async (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => {
    if (!confirm(`Tem certeza que deseja excluir esta transação?`)) {
      return;
    }

    try {
      if (tipo === "gasto") {
        await deletarGasto(transacao.id);
      } else {
        await deletarGanho(transacao.id);
      }

      // Recarrega do zero após exclusão
      await fetchTransacoes("gasto", null, true);
      await fetchTransacoes("ganho", null, true);
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      alert("Erro ao deletar transação. Tente novamente.");
    }
  };

  async function handleSubmit(
    data: TransacaoFormData,
    modalAberto: "gasto" | "ganho",
    id?: string
  ) {
    if (!user) return;

    try {
      if (id) {
        // MODO EDIÇÃO
        if (modalAberto === "gasto") {
          await editarGasto(id, data as Partial<Gastos>);
        } else if (modalAberto === "ganho") {
          await editarGanho(id, data as Partial<Ganhos>);
        }
      } else {
        // MODO CRIAÇÃO
        if (modalAberto === "gasto") {
          await criarGasto({
            ...(data as GastoFormData),
            userId: user.uid,
            fechado: false,
          });
        } else if (modalAberto === "ganho") {
          await criarGanho({
            ...(data as GanhoFormData),
            userId: user.uid,
            fechado: false,
          });
        }
      }

      // Recarrega do zero após salvar/editar
      await fetchTransacoes("gasto", null, true);
      await fetchTransacoes("ganho", null, true);

      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert(`Erro ao ${id ? "editar" : "salvar"} transação. Tente novamente.`);
      return { success: false };
    }
  }

  // --- FECHAMENTO DE PERÍODO ---

  async function handleFecharPeriodo() {
    if (!user) return;
    setIsClosing(true);
    try {
      const hoje = new Date();
      // Usando o primeiro dia do mês atual como início e o primeiro dia do próximo como fim
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
      const periodoMetadado = `${hoje.getFullYear()}-${hoje.getMonth() + 1}`;

      await fecharPeriodo(user.uid, periodoMetadado, inicioMes, fimMes);
      await fetchUltimoFechamento();

      // Recarrega as listas garantindo que estão desfechadas
      await fetchTransacoes("gasto", null, true);
      await fetchTransacoes("ganho", null, true);
    } catch (error) {
      console.error("Erro ao fechar período:", error);
      alert("Não foi possível fechar o período. Verifique o console.");
    } finally {
      setIsClosing(false);
    }
  }

  // --- EFEITO INICIAL ---
  useEffect(() => {
    if (!loading && user) {
      fetchUltimoFechamento();
      // Carrega a primeira página das duas listas
      fetchTransacoes("gasto", null, true);
      fetchTransacoes("ganho", null, true);
    }
  }, [user, loading, fetchUltimoFechamento, fetchTransacoes]);

  // Ação de carregar a próxima página
  const handleLoadMore = (tipo: "gasto" | "ganho") => {
    if (tipo === "gasto" && lastDocGasto) {
      fetchTransacoes("gasto", lastDocGasto);
    } else if (tipo === "ganho" && lastDocGanho) {
      fetchTransacoes("ganho", lastDocGanho);
    }
  };

  return {
    user,
    loading,
    gastos,
    ganhos,
    // Paginação
    lastDocGasto,
    lastDocGanho,
    hasMoreGastos,
    hasMoreGanhos,
    handleLoadMore,
    // Fechamento
    totalGastosFechado: ultimoFechamento?.totalGastos ?? 0,
    totalGanhosFechado: ultimoFechamento?.totalGanhos ?? 0,
    saldoFechado: ultimoFechamento?.saldo ?? 0,
    isClosing,
    handleFecharPeriodo,
    // CRUD
    handleSubmit,
    handleDelete,
    fetchTransacoes, // Pode ser útil para forçar refresh
  };
};

export default useDashboardData;
