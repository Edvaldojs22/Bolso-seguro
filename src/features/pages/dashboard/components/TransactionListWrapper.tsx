import type {
  Ganhos,
  Gastos,
} from "../../../services/transacao/transacaoService";
import TransactionListItem from "./TransactionListItem";
type TransacaoUnificada = Gastos & Ganhos;
interface TransactionListWrapperProps {
  list: (Gastos | Ganhos)[];
  isGasto: boolean;
  emptyMessage: string;
  hasMore: boolean;
  view: "gasto" | "ganho";
  onLoadMore: (tipo: "gasto" | "ganho") => void;
  onEdit: (transacao: Gastos | Ganhos, tipo: "gasto" | "ganho") => void;
  onDelete: (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => Promise<void>;
}

const TransactionListWrapper: React.FC<TransactionListWrapperProps> = ({
  list,
  isGasto,
  emptyMessage,
  hasMore,
  view,
  onLoadMore,
  onEdit,
  onDelete,
}) => {
  if (list.length === 0) {
    return (
      <p className="text-gray-500 italic p-4 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="pt-2">
      <ul className="divide-y divide-gray-200">
        {list.map((t) => (
          <TransactionListItem
            key={t.id}
            transacao={t as TransacaoUnificada}
            isGasto={isGasto}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>

      {/* Botão de Paginação */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => onLoadMore(view)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Carregar Mais {isGasto ? "Gastos" : "Ganhos"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionListWrapper;
