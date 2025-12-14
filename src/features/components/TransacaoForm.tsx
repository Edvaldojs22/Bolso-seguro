import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  buscaCategoriasPorUsuario,
  criarCategoria,
  type Categoria,
} from "../services/transacao/transacaoService";
import type {
  GanhoFormData,
  GastoFormData,
} from "../pages/dashboard/Dashboard";

// Interface Ganhos/Gastos movidas para cá ou importadas do seu arquivo de tipos
interface Ganhos {
  id: string;
  valor: number;
  origem: string;
  descricao?: string /* ... */;
}
interface Gastos {
  id: string;
  valor: number;
  categoria: string;
  descricao?: string /* ... */;
}

interface TransacaoFormProps {
  tipo: "gasto" | "ganho";
  // O tipo de retorno de onSubmit deve indicar se é criação ou edição
  onSubmit: (data: GastoFormData | GanhoFormData, id?: string) => Promise<void>;
  // NOVO: Dados iniciais para edição
  initialData?: ((Gastos | Ganhos) & { id: string }) | null;
}

export default function TransacaoForm({
  tipo,
  onSubmit,
  initialData, // 🚨 Receber initialData nas props
}: TransacaoFormProps) {
  const { user } = useAuth();

  // 1. Definição do modo de edição
  const isEditing = !!initialData;

  // 2. Lógica de inicialização de valores
  const initialCategoryOrOrigin = initialData
    ? (initialData as Gastos).categoria || (initialData as Ganhos).origem || ""
    : "";

  // 3. Inicialização dos Estados (usando dados iniciais se houver)
  const [valor, setValor] = useState<number>(initialData?.valor ?? 0);
  const [descricao, setDescricao] = useState(initialData?.descricao ?? "");

  // Inicializa a categoria ou origem com o valor apropriado dos dados iniciais
  const [categoria, setCategoria] = useState(
    tipo === "gasto" ? initialCategoryOrOrigin : ""
  );
  const [origem, setOrigem] = useState(
    tipo === "ganho" ? initialCategoryOrOrigin : ""
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erroValidacao, setErroValidacao] = useState("");

  // Carrega categorias filtradas pelo tipo
  useEffect(() => {
    if (user) {
      (async () => {
        const lista = await buscaCategoriasPorUsuario(user.uid, tipo);
        setCategorias(lista);
      })();
    }
  }, [user, tipo]);

  const currentCategoryValue = tipo === "gasto" ? categoria : origem;
  const setCurrentCategoryValue = tipo === "gasto" ? setCategoria : setOrigem;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroValidacao("");

    if (!user) return;
    if (valor <= 0) {
      setErroValidacao("O valor deve ser maior que zero.");
      return;
    }

    if (!currentCategoryValue || currentCategoryValue.trim() === "") {
      setErroValidacao(
        tipo === "gasto"
          ? "Você deve selecionar ou digitar uma Categoria."
          : "Você deve selecionar ou digitar uma Origem."
      );
      return;
    }

    const novaCategoriaNome = currentCategoryValue.trim();
    const categoriaExistente = categorias.find(
      (c) => c.nome === novaCategoriaNome
    );

    // 🚨 SÓ CRIA NOVA CATEGORIA SE NÃO ESTIVER EDITANDO
    if (!isEditing && !categoriaExistente) {
      try {
        await criarCategoria({
          nome: novaCategoriaNome,
          userId: user.uid,
          tipo: tipo,
        });

        // Atualiza o estado local
        const novaCategoria: Categoria = {
          id: "temp-" + Date.now(),
          nome: novaCategoriaNome,
          userId: user.uid,
          tipo: tipo,
          criadoEm: new Date(),
        };
        setCategorias((prev) => [...prev, novaCategoria]);
      } catch (error) {
        console.error("Erro ao criar nova categoria:", error);
      }
    }

    // 🚨 Preparação dos dados da transação
    const transacaoData = {
      valor,
      descricao,
      // Passa a categoria ou origem dependendo do tipo
      ...(tipo === "gasto"
        ? { categoria: novaCategoriaNome }
        : { origem: novaCategoriaNome }),
      data: new Date(), // A data será atualizada no serviço, se necessário
    };

    // 🚨 Submissão/Edição: Passa o ID se estiver editando, se não, passa undefined
    onSubmit(transacaoData, isEditing ? initialData?.id : undefined);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow"
    >
      {/* Título renderizado dinamicamente */}
      <h2 className="text-xl font-bold mb-4">
        {isEditing
          ? `Editar ${tipo === "gasto" ? "Gasto" : "Ganho"}`
          : `Adicionar ${tipo === "gasto" ? "Gasto" : "Ganho"}`}
      </h2>

      {erroValidacao && <p className="text-red-500 text-sm">{erroValidacao}</p>}

      {/* Campo Valor */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Valor</label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Campo de Seleção/Input de Categoria/Origem */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tipo === "gasto" ? "Categoria" : "Origem (Categoria de Ganho)"}
        </label>

        {/* Select de categorias existentes */}
        <select
          value={currentCategoryValue}
          onChange={(e) => setCurrentCategoryValue(e.target.value)}
          className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>

        {/* Input para nova categoria (ou edição de existente) */}
        <input
          type="text"
          placeholder={`Nova ${tipo === "gasto" ? "categoria" : "origem"}`}
          value={currentCategoryValue}
          onChange={(e) => setCurrentCategoryValue(e.target.value)}
          className="mt-2 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Campo Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descrição (Opcional)
        </label>
        <input
          type="text"
          value={descricao}
          placeholder="Ex: cinema, salário"
          onChange={(e) => setDescricao(e.target.value)}
          className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Botão de Submissão */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        {isEditing ? "Salvar Edição" : "Salvar"}
      </button>
    </form>
  );
}
