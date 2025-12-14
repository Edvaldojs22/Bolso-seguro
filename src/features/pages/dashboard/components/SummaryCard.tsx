// Função utilitária

const formatarMoeda = (valor: number | null) => {
  if (valor === null) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

interface SummaryCardProps {
  title: string;
  value: number; // Recebe o valor já processado (0 se null)
  color: string; // Ex: "text-green-600"
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  color,
  icon,
}) => {
  const displayValue = formatarMoeda(value);
  const isNegative = value < 0;
  const textColor = isNegative ? "text-red-700" : color;
  // Ex: "text-green-600" -> "bg-green-600"
  const bgColor = isNegative
    ? "bg-red-50"
    : `${color
        .replace("text-", "bg-")
        .replace("-600", "-50")
        .replace("-700", "-50")}`;

  return (
    <div
      className={`p-6 rounded-xl shadow-lg ${bgColor} flex items-center justify-between transition-shadow hover:shadow-xl`}
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

export default SummaryCard;
