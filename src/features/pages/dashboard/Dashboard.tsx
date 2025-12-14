import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
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
  type Gasto,
  type Gastos,
} from "../../services/transacao/transacaoService";
import {
  buscaUltimoFechamento,
  fecharPeriodo,
  type Fechamento,
} from "../../services/fechamento/fechamentoService"; // AJUSTE O CAMINHO E O TIPO
import TransacaoForm from "../../components/TransacaoForm";
import type {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";

export type GastoFormData = Omit<Gasto, "userId" | "fechado">;
export type GanhoFormData = Omit<Ganhos, "userId" | "fechado" | "id">;
type TransacaoFormData = GastoFormData | GanhoFormData;
// --- Funções Utilitárias (Mantidas) ---
const formatarMoeda = (valor: number) => {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

interface SummaryCardProps {
  title: string;
  value: number | null;
  color: string;
  icon: string;
}

const SummaryCard = ({ title, value, color, icon }: SummaryCardProps) => {
  const displayValue = value === null ? "R$ 0,00" : formatarMoeda(value);
  const isNegative = (value ?? 0) < 0;
  const textColor = isNegative ? "text-red-700" : color;
  const bgColor = isNegative
    ? "bg-red-50"
    : `${color.replace("text-", "bg-")}50`;

  return (
    <div
      className={`p-6 rounded-xl shadow-lg ${bgColor} flex items-center justify-between`}
    >
      <div>
        <h2 className={`text-md font-medium ${textColor}`}>{title}</h2>
        <p className={`text-3xl font-extrabold mt-1 ${textColor}`}>
          {displayValue}
        </p>
      </div>
      <span className={`text-4xl ${textColor}`}>{icon}</span>
    </div>
  );
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [gastos, setGastos] = useState<Gastos[]>([]);
  const [ganhos, setGanhos] = useState<Ganhos[]>([]);
  const [modalAberto, setModalAberto] = useState<"gasto" | "ganho" | null>(
    null
  );
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<
    (Gastos & Ganhos) | null
  >(null);

  const [view, setView] = useState<"gasto" | "ganho">("gasto");

  // --- ESTADOS DE DADOS DO FECHAMENTO ---
  const [ultimoFechamento, setUltimoFechamento] = useState<Fechamento | null>(
    null
  );
  const [isClosing, setIsClosing] = useState(false); // Novo estado para loading

  // --- ESTADOS DE PAGINAÇÃO ---
  const [lastDocGasto, setLastDocGasto] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDocGanho, setLastDocGanho] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreGastos, setHasMoreGastos] = useState(true);
  const [hasMoreGanhos, setHasMoreGanhos] = useState(true);

  // --- DADOS DOS CARDS (ÚLTIMO FECHAMENTO) ---
  const totalGastosFechado = ultimoFechamento?.totalGastos ?? 0;
  const totalGanhosFechado = ultimoFechamento?.totalGanhos ?? 0;
  const saldoFechado = ultimoFechamento?.saldo ?? 0;

  //Edicao e exclusao
  const handleEditClick = (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => {
    // Definimos a transação e o tipo, abrindo o modal
    setTransacaoEmEdicao(transacao as Gastos & Ganhos);
    setModalAberto(tipo);
  };

  // Funções de Exclusão
  const handleDelete = async (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir esta transação (${formatarMoeda(
          transacao.valor
        )})?`
      )
    ) {
      return;
    }

    try {
      if (tipo === "gasto") {
        await deletarGasto(transacao.id);
      } else {
        await deletarGanho(transacao.id);
      }

      // Recarrega as listas após exclusão
      fetchTransacoes("gasto");
      fetchTransacoes("ganho");
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      alert("Erro ao deletar transação. Tente novamente.");
    }
  };
  //Atualizar relatorio ou cria o novo
  async function handleFecharPeriodo() {
    if (!user) return;
    setIsClosing(true);
    try {
      // Usando o primeiro dia do mês atual como início e o primeiro dia do próximo como fim
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

      // O 'periodo' para metadados (se necessário)
      const periodoMetadado = `${hoje.getFullYear()}-${hoje.getMonth() + 1}`;

      await fecharPeriodo(user.uid, periodoMetadado, inicioMes, fimMes);
      await fetchUltimoFechamento();

      fetchTransacoes("gasto");
      fetchTransacoes("ganho");
    } catch (error) {
      console.error("Erro ao fechar período:", error);
      alert("Não foi possível fechar o período. Verifique o console.");
    } finally {
      setIsClosing(false);
    }
  }
  // Fecha o modal e limpa o estado de edição ao fechar
  const handleCloseModal = () => {
    setModalAberto(null);
    setTransacaoEmEdicao(null);
  };

  // Função unificada para buscar transações com paginação
  const fetchTransacoes = async (
    tipo: "gasto" | "ganho",
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
  ) => {
    if (!user) return;

    try {
      if (tipo === "gasto") {
        const docParaPassar = lastDoc === null ? undefined : lastDoc;
        const { gastos: novosGastos, lastDoc: novoLastDoc } =
          await buscaGastosPorUsuario(user.uid, docParaPassar);

        setGastos((prev) =>
          lastDoc ? [...prev, ...novosGastos] : novosGastos
        );
        setLastDocGasto(novoLastDoc);
        setHasMoreGastos(novosGastos.length === 10);
      } else {
        const docParaPassar = lastDoc === null ? undefined : lastDoc;
        const { ganhos: novosGanhos, lastDoc: novoLastDoc } =
          await buscaGanhosPorUsuario(user.uid, docParaPassar);

        setGanhos((prev) =>
          lastDoc ? [...prev, ...novosGanhos] : novosGanhos
        );
        setLastDocGanho(novoLastDoc);
        setHasMoreGanhos(novosGanhos.length === 10);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${tipo}:`, error);
    }
  };

  // Função para buscar o último fechamento
  const fetchUltimoFechamento = async () => {
    if (!user) return;
    try {
      const fechamento = await buscaUltimoFechamento(user.uid);
      setUltimoFechamento(fechamento);
    } catch (error) {
      console.error("Erro ao buscar último fechamento:", error);
    }
  };

  // --- useEffect PRINCIPAL ---
  useEffect(() => {
    if (!loading && user) {
      // 1. Busca Histórico na montagem
      fetchUltimoFechamento();

      // 2. Busca listas (apenas a primeira página)
      if (view === "gasto") {
        fetchTransacoes("gasto");
      } else {
        fetchTransacoes("ganho");
      }
    }
  }, [user, loading, view]);
  // Nota: `view` no array de dependências força o recarregamento (primeira página) ao trocar de lista.

  // Ação de carregar a próxima página
  const handleLoadMore = (tipo: "gasto" | "ganho") => {
    if (tipo === "gasto" && lastDocGasto) {
      fetchTransacoes("gasto", lastDocGasto);
    } else if (tipo === "ganho" && lastDocGanho) {
      fetchTransacoes("ganho", lastDocGanho);
    }
  };

  // Submeter gasto ou ganho
  async function handleSubmit(data: TransacaoFormData, id?: string) {
    if (!user) return;

    try {
      if (id) {
        // --- MODO EDIÇÃO (id fornecido) ---
        if (modalAberto === "gasto") {
          // Chama a função de edição do Gasto, passando o ID e os dados
          await editarGasto(id, data as Partial<Gastos>);
        } else if (modalAberto === "ganho") {
          // Chama a função de edição do Ganho, passando o ID e os dados
          await editarGanho(id, data as Partial<Ganhos>);
        }
      } else {
        // --- MODO CRIAÇÃO (sem id) ---
        if (modalAberto === "gasto") {
          await criarGasto({
            ...(data as GastoFormData), // Asserção para o tipo específico
            userId: user.uid,
            fechado: false,
          });
        } else if (modalAberto === "ganho") {
          await criarGanho({ ...data, userId: user.uid, fechado: false });
        }
      }

      // 1. Atualiza as listas (volta para a primeira página para ver o novo/editado item)
      fetchTransacoes("gasto");
      fetchTransacoes("ganho");
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert(`Erro ao ${id ? "editar" : "salvar"} transação. Tente novamente.`);
    }

    setModalAberto(null);
  }
  const isTimestamp = (
    data: Date | Timestamp | undefined
  ): data is Timestamp => {
    // Verifica se existe e se tem o método 'toDate' (característica do Timestamp)
    return !!data && typeof (data as Timestamp).toDate === "function";
  };

  // Renderização da Lista de Transações (Adaptada para dados paginados)
  const TransactionList = () => {
    const list = view === "gasto" ? gastos : ganhos;
    const emptyMessage =
      view === "gasto" ? "Sem gastos recentes." : "Sem ganhos recentes.";
    const hasMore = view === "gasto" ? hasMoreGastos : hasMoreGanhos;
    const lastDoc = view === "gasto" ? lastDocGasto : lastDocGanho;
    const isGasto = view === "gasto";

    if (list.length === 0) {
      return <p className="text-gray-500 italic p-4">{emptyMessage}</p>;
    }

    // A lista já vem ordenada por data descendente (mais recente primeiro) das funções de busca.
    return (
      <div className="pt-2">
        <ul className="divide-y divide-gray-200">
          {list.map((t) => {
            const transacao = t as Gastos & Ganhos;
            const categoriaOuOrigem = isGasto
              ? (transacao as Gastos).categoria
              : (transacao as Ganhos).origem;

            // Lógica para formatar a data (mantida do seu código)
            const dataFormatada = (() => {
              const data = transacao.data;

              if (!data) {
                return "Data N/A";
              }

              if (data instanceof Date) {
                // Se for um objeto Date nativo
                return data.toLocaleDateString("pt-BR");
              }

              if (isTimestamp(data)) {
                // Se for um Timestamp do Firebase
                return data.toDate().toLocaleDateString("pt-BR");
              }

              // Fallback caso o tipo não seja nem Date nem Timestamp (se for null, etc.)
              return "Data N/A";
            })();
            return (
              <li
                key={transacao.id}
                className="py-4 flex justify-between items-center hover:bg-gray-50 transition duration-150"
              >
                {/* 🚨 BLOCO DE INFORMAÇÃO DA TRANSAÇÃO: DE VOLTA 🚨 */}
                <div className="flex items-start space-x-3">
                  {/* Aqui podemos adicionar um ícone simples, se desejar, mas vou manter a estrutura básica de texto */}
                  <div className="text-sm">
                    <p className="text-md font-bold text-gray-800">
                      {categoriaOuOrigem}
                    </p>
                    <p className="text-gray-600 truncate max-w-xs">
                      {transacao.descricao ||
                        (isGasto ? "Sem descrição" : "Sem descrição")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dataFormatada}
                    </p>
                  </div>
                </div>
                {/* FIM DO BLOCO DE INFORMAÇÃO DA TRANSAÇÃO */}

                <div className="flex items-center space-x-4">
                  <span
                    className={`text-lg font-semibold ${
                      isGasto ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatarMoeda(transacao.valor)}
                  </span>

                  {/* BOTÕES DE AÇÃO (Permanece) */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(transacao, view)}
                      title="Editar Transação"
                      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(transacao, view)}
                      title="Excluir Transação"
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Botão de Paginação (Permanece) */}
        {hasMore && lastDoc && (
          <div className="mt-6 text-center">
            <button
              onClick={() => handleLoadMore(view)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Carregar Mais {view === "gasto" ? "Gastos" : "Ganhos"}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <p className="text-center p-8 text-gray-600">
        Carregando dados financeiros...
      </p>
    );
  }

  return (
    <div className="min-h-screen jus bg-gray-50 p-6 md:p-10">
      <h1 className="text-[26px] font-extrabold text-gray-900 mb-8 border-b pb-2">
        Dashboard Financeiro
      </h1>
      {/* Botões de ação */}
      <div className="flex justify-center gap-10 mb-4 p-4 bg-white rounded-xl shadow-lg">
        <button
          onClick={() => {
            // 🚨 LIMPEZA: Garante que não há dados de edição
            setTransacaoEmEdicao(null);
            setModalAberto("gasto");
          }}
          className="flex items-center bg-red-600 text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-red-700 transition shadow-md"
        >
          ➕ Gasto
        </button>
        <button
          onClick={() => {
            // 🚨 LIMPEZA: Garante que não há dados de edição
            setTransacaoEmEdicao(null);
            setModalAberto("ganho");
          }}
          className="flex items-center bg-green-600 text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-green-700 transition shadow-md"
        >
          ➕ Ganho
        </button>
      </div>

      <p className="font-bold text-blue-500 text-center">
        Relatório Atual de (
        {new Date().toLocaleDateString("pt-BR", { month: "long" })})
      </p>

      {/* Cards de resumo - AGORA COM DADOS DO ÚLTIMO FECHAMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SummaryCard
          title="Ganhos do Mês"
          value={totalGanhosFechado}
          color="text-green-600"
          icon="💵"
        />
        <SummaryCard
          title="Gastos do Mês"
          value={totalGastosFechado}
          color="text-red-600"
          icon="💸"
        />
        <SummaryCard
          title="Saldo do Mês"
          value={saldoFechado}
          color={saldoFechado >= 0 ? "text-blue-600" : "text-red-600"}
          icon="⚖️"
        />
      </div>

      <button
        onClick={handleFecharPeriodo}
        disabled={isClosing}
        className={`
            flex mx-auto my-4 items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition 
            ${
              isClosing
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }
          `}
      >
        {isClosing ? "Processando..." : "🔄 Fechar/Atualizar Período"}
      </button>
      {/* Seção de Transações e Alternância de Visualização */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {view === "gasto" ? "Gastos" : "Ganhos"}
          </h2>
          {/* Botões para alternar entre gastos e ganhos */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setView("gasto")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${
                view === "gasto"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setView("ganho")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${
                view === "ganho"
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Ganhos
            </button>
          </div>
        </div>

        {/* Lista dinâmica com Paginação */}
        <TransactionList />
      </div>

      {/* Modal usando TransacaoForm */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all scale-100 duration-300">
            <div className="p-6">
              <TransacaoForm
                tipo={modalAberto}
                onSubmit={handleSubmit}
                // 🚨 NOVO PROPS: Passando os dados para o formulário
                initialData={transacaoEmEdicao}
              />
            </div>
            <button
              onClick={handleCloseModal} // Usando a nova função
              className="w-full text-center py-3 bg-gray-100 text-gray-600 font-medium rounded-b-xl hover:bg-gray-200 transition border-t"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
