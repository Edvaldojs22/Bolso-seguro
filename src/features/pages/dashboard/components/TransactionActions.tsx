import { CirclePlus } from "lucide-react";

interface TransactionActionsProps {
  onOpenGasto: () => void;
  onOpenGanho: () => void;
}

const TransactionActions: React.FC<TransactionActionsProps> = ({
  onOpenGasto,
  onOpenGanho,
}) => {
  return (
    <div className="flex justify-center gap-10 mb-4 p-4 rounded-xl ">
      <button
        onClick={onOpenGasto}
        className="flex s items-center bg-red-600 text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-red-700 transition shadow-md"
      >
        <CirclePlus />
        <span className=" ml-2">Gasto</span>
      </button>
      <button
        onClick={onOpenGanho}
        className="flex items-center bg-green-600 text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-green-700 transition shadow-md"
      >
        <CirclePlus />
        <span className=" ml-2"> Ganho</span>
      </button>
    </div>
  );
};

export default TransactionActions;
