import type {
  Ganhos,
  Gastos,
} from "../../../services/transacao/transacaoService";
import TransactionListWrapper from "./TransactionListWrapper";

interface TransactionSectionProps {
  // ... props permanecem as mesmas
  view: "gasto" | "ganho";
  setView: (view: "gasto" | "ganho") => void;
  gastos: Gastos[];
  ganhos: Ganhos[];
  hasMoreGastos: boolean;
  hasMoreGanhos: boolean;
  onLoadMore: (tipo: "gasto" | "ganho") => void;
  onEdit: (transacao: Gastos | Ganhos, tipo: "gasto" | "ganho") => void;
  onDelete: (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => Promise<void>;
}

const TransactionSection: React.FC<TransactionSectionProps> = ({
  view,
  setView,
  gastos,
  ganhos,
  hasMoreGastos,
  hasMoreGanhos,
  onLoadMore,
  onEdit,
  onDelete,
}) => {
  const list = view === "gasto" ? gastos : ganhos;
  const isGasto = view === "gasto";
  const emptyMessage = isGasto
    ? "Sem gastos recentes."
    : "Sem ganhos recentes.";
  const hasMore = isGasto ? hasMoreGastos : hasMoreGanhos;

  // A FUNÇÃO TransactionList FOI REMOVIDA DAQUI!

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        {/* ... Lógica dos botões de alternância de view permanece aqui ... */}
        <h2 className="text-2xl font-bold text-gray-800">
          {isGasto ? "Gastos" : "Ganhos"}
        </h2>
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setView("gasto")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${
              isGasto
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setView("ganho")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${
              !isGasto
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Ganhos
          </button>
        </div>
      </div>

      {/* CHAMADA AO NOVO COMPONENTE EXTERNO */}
      <TransactionListWrapper
        list={list}
        isGasto={isGasto}
        emptyMessage={emptyMessage}
        hasMore={hasMore}
        view={view}
        onLoadMore={onLoadMore}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default TransactionSection;
