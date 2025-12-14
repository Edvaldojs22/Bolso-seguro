import type { Timestamp } from "firebase/firestore";
import type {
  Ganhos,
  Gastos,
} from "../../../services/transacao/transacaoService";

type TransacaoUnificada = Gastos & Ganhos;
const formatarMoeda = (valor: number) => {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const isTimestamp = (data: Date | Timestamp | undefined): data is Timestamp => {
  return !!data && typeof (data as Timestamp).toDate === "function";
};
interface TransactionListItemProps {
  transacao: TransacaoUnificada;
  isGasto: boolean;
  onEdit: (transacao: Gastos | Ganhos, tipo: "gasto" | "ganho") => void;
  onDelete: (
    transacao: Gastos | Ganhos,
    tipo: "gasto" | "ganho"
  ) => Promise<void>;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transacao,
  isGasto,
  onEdit,
  onDelete,
}) => {
  const categoriaOuOrigem = isGasto
    ? (transacao as Gastos).categoria
    : (transacao as Ganhos).origem;

  const tipoView = isGasto ? "gasto" : "ganho";

  // Lógica de formatação de data
  const dataFormatada = (() => {
    const data = transacao.data;

    if (!data) return "Data N/A";
    if (data instanceof Date) return data.toLocaleDateString("pt-BR");
    if (isTimestamp(data)) return data.toDate().toLocaleDateString("pt-BR");

    return "Data N/A";
  })();

  return (
    <li
      key={transacao.id}
      className="py-4 flex justify-between items-center hover:bg-gray-50 transition duration-150 border-b border-gray-100 last:border-b-0"
    >
      {/* BLOCO DE INFORMAÇÃO DA TRANSAÇÃO */}
      <div className="flex items-start space-x-3">
        <div className="text-sm">
          <p className="text-md font-bold text-gray-800">{categoriaOuOrigem}</p>
          <p className="text-gray-600 truncate max-w-xs">
            {transacao.descricao ||
              (isGasto ? "Sem descrição" : "Sem descrição")}
          </p>
          <p className="text-xs text-gray-500 mt-1">{dataFormatada}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span
          className={`text-lg font-semibold ${
            isGasto ? "text-red-600" : "text-green-600"
          }`}
        >
          {formatarMoeda(transacao.valor)}
        </span>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(transacao, tipoView)}
            title="Editar Transação"
            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(transacao, tipoView)}
            title="Excluir Transação"
            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
          >
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
};

export default TransactionListItem;
