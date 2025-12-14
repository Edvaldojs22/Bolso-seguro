import SummaryCard from "./SummaryCard";

interface DashboardSummaryProps {
  totalGastos: number;
  totalGanhos: number;
  saldo: number;
  onClosePeriod: () => void;
  isClosing: boolean;
}
const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  totalGastos,
  totalGanhos,
  saldo,
  onClosePeriod,
  isClosing,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={onClosePeriod}
          disabled={isClosing}
          className={`
          flex mx-auto mb-0 mt-4 items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition 
          ${
            isClosing
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
          }
        `}
        >
          {isClosing ? "Processando..." : "🔄 Fechar/Atualizar Período"}
        </button>
        <SummaryCard
          title="Ganhos do Mês"
          value={totalGanhos}
          color="text-green-600"
          icon="💵"
        />
        <SummaryCard
          title="Gastos do Mês"
          value={totalGastos}
          color="text-red-600"
          icon="💸"
        />
        <SummaryCard
          title="Saldo do Mês"
          value={saldo}
          color={saldo >= 0 ? "text-blue-600" : "text-red-600"}
          icon="⚖️"
        />
      </div>
    </>
  );
};

export default DashboardSummary;
