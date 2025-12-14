import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../../config/firebase/firebase";

export interface TransacaoBase {
  valor: number;
  userId: string;
  descricao?: string;
  data?: Date | Timestamp;
  fechado: boolean;
}

export interface Gasto extends TransacaoBase {
  categoria: string;
}
export interface Gastos extends TransacaoBase {
  id: string;
  categoria: string;
}

export interface Ganho extends TransacaoBase {
  origem?: string;
}
export interface Ganhos extends TransacaoBase {
  id: string;
  origem: string;
}

function convertToTimestamp(dateOrTimestamp?: Date | Timestamp): Timestamp {
  if (!dateOrTimestamp) {
    return Timestamp.now();
  }

  // Se a propriedade 'toDate' existir, já é um Timestamp, retorna ele.
  if ((dateOrTimestamp as Timestamp).toDate !== undefined) {
    return dateOrTimestamp as Timestamp;
  }

  // Caso contrário, é um objeto Date (ou assumimos que é, baseado na tipagem)
  return Timestamp.fromDate(dateOrTimestamp as Date);
}
//-------------------
//Gastos
export const gastosCollection = collection(db, "gastos");
//Criar Gastos
export async function criarGasto(gasto: Gasto) {
  try {
    const docRef = await addDoc(gastosCollection, {
      valor: gasto.valor,
      userId: gasto.userId,
      categoria: gasto.categoria,
      descricao: gasto.descricao ?? "",
      fechado: false,
      data: convertToTimestamp(gasto.data),
    });
    console.log("Gasto criado com ID:", docRef.id);
  } catch (error) {
    console.error("Erro ao criar gasto");
    throw error;
  }
}

//Excluir Gasto
export async function deletarGasto(id: string) {
  try {
    const gastoRef = doc(gastosCollection, id);
    await deleteDoc(gastoRef);
    console.log("Gasto deletado com ID:", id);
  } catch (error) {
    console.error("Erro ao deletar gasto:", error);
    throw error;
  }
}

//Editar Gasto
export async function editarGasto(id: string, gasto: Partial<Gasto>) {
  try {
    const gastoRef = doc(gastosCollection, id);

    await updateDoc(gastoRef, {
      ...(gasto.valor !== undefined && { valor: gasto.valor }),
      ...(gasto.categoria !== undefined && { categoria: gasto.categoria }),
      ...(gasto.descricao !== undefined && { descricao: gasto.descricao }),
      ...(gasto.data !== undefined && { data: convertToTimestamp(gasto.data) }),
      // não atualiza userId nem fechado por padrão
    });

    console.log("Gasto atualizado com ID:", id);
  } catch (error) {
    console.error("Erro ao editar gasto:", error);
    throw error;
  }
}
//Busca Gatos com paginação
export async function buscaGastosPorUsuario(
  userId: string,
  lastDoc?: QueryDocumentSnapshot<DocumentData> // último doc da página anterior
): Promise<{
  gastos: Gastos[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  try {
    // 1. Array para construir todas as restrições da query
    const constraints = [];

    // Filtro obrigatório: ID do usuário
    constraints.push(where("userId", "==", userId));

    // Ordenação obrigatória (a paginação requer a mesma ordenação)
    constraints.push(orderBy("data", "desc"));

    // 2. Se houver um 'lastDoc', adiciona a cláusula startAfter para a paginação
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // 3. Limite de documentos por página
    constraints.push(limit(10));

    // Constrói a query usando o spread operator para aplicar todas as restrições
    const q = query(gastosCollection, ...constraints);

    const querySnapshot = await getDocs(q);

    const gastos: Gastos[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        valor: data.valor,
        userId: data.userId,
        categoria: data.categoria,
        descricao: data.descricao,
        data: data.data?.toDate(),
      } as Gastos;
    });

    // Último documento da página atual (para usar na próxima chamada)
    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    return { gastos, lastDoc: lastVisible };
  } catch (error) {
    console.error("Erro ao buscar gastos do usuário", error);
    throw error;
  }
}

//---------------------

//Ganhos
export const ganhosCollection = collection(db, "ganhos");

// Criar Ganhs
export async function criarGanho(ganho: Ganho) {
  try {
    const docRef = await addDoc(ganhosCollection, {
      valor: ganho.valor,
      userId: ganho.userId,
      origem: ganho.origem ?? "",
      descricao: ganho.descricao ?? "",
      fechado: false,
      data: convertToTimestamp(ganho.data),
    });
    console.log("Ganho criado com ID:", docRef.id);
  } catch (error) {
    console.error("Erro ao criar ganho");
    throw error;
  }
}

//Escluir Ganho
export async function deletarGanho(id: string) {
  try {
    const ganhoRef = doc(ganhosCollection, id);
    await deleteDoc(ganhoRef);
    console.log("Ganho deletado com ID:", id);
  } catch (error) {
    console.error("Erro ao deletar ganho:", error);
    throw error;
  }
}
//Editar Ganho
export async function editarGanho(id: string, ganho: Partial<Ganho>) {
  try {
    const ganhoRef = doc(ganhosCollection, id);

    await updateDoc(ganhoRef, {
      ...(ganho.valor !== undefined && { valor: ganho.valor }),
      ...(ganho.origem !== undefined && { origem: ganho.origem }),
      ...(ganho.descricao !== undefined && { descricao: ganho.descricao }),
      ...(ganho.data !== undefined && { data: convertToTimestamp(ganho.data) }),
      // não atualiza userId nem fechado por padrão
    });

    console.log("Ganho atualizado com ID:", id);
  } catch (error) {
    console.error("Erro ao editar ganho:", error);
    throw error;
  }
}

// Buscar Ganhos com paginação
export async function buscaGanhosPorUsuario(
  userId: string,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  ganhos: Ganhos[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  try {
    // 1. Array para construir todas as restrições da query
    const constraints = [];

    // Filtro obrigatório: ID do usuário
    constraints.push(where("userId", "==", userId));

    // Ordenação obrigatória
    constraints.push(orderBy("data", "desc"));

    // 2. Se houver um 'lastDoc', adiciona a cláusula startAfter para a paginação
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // 3. Limite de documentos por página
    constraints.push(limit(10));

    // Constrói a query em uma única chamada
    const q = query(ganhosCollection, ...constraints);

    const querySnapshot = await getDocs(q);

    const ganhos: Ganhos[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        valor: data.valor,
        userId: data.userId,
        origem: data.origem,
        descricao: data.descricao,
        data: data.data?.toDate(),
      } as Ganhos;
    });

    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    return { ganhos, lastDoc: lastVisible };
  } catch (error) {
    console.error("Erro ao buscar ganhos do usuário", error);
    throw error;
  }
}

//Categorias
export interface Categoria {
  id?: string;
  nome: string;
  userId: string;
  tipo?: "gasto" | "ganho";
  criadoEm?: Date;
}
const categoriasGastosCollection = collection(db, "categoriasGastos");
const categoriasGanhosCollection = collection(db, "categoriasGanhos");
function getCategoriaCollectionRef(tipo: "gasto" | "ganho") {
  return tipo === "gasto"
    ? categoriasGastosCollection
    : categoriasGanhosCollection;
}

// Criar categoria
export async function criarCategoria(categoria: Categoria) {
  // O tipo é obrigatório para decidir em qual coleção salvar
  if (!categoria.tipo) {
    throw new Error(
      "O tipo da categoria (gasto/ganho) é obrigatório para a criação."
    );
  }

  try {
    const targetCollection = getCategoriaCollectionRef(categoria.tipo);

    // Na nova estrutura, o campo 'tipo' NÃO É MAIS NECESSÁRIO
    // dentro do documento, pois a coleção já o define.
    const docRef = await addDoc(targetCollection, {
      nome: categoria.nome,
      userId: categoria.userId,
      criadoEm: Timestamp.now(),
    });
    console.log(`Categoria de ${categoria.tipo} criada com ID:`, docRef.id);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    throw error;
  }
}

// Editar categoria
export async function editarCategoria(
  id: string,
  tipo: "gasto" | "ganho", // PRECISAMOS DO TIPO para saber qual coleção atualizar
  categoria: Partial<Categoria>
) {
  try {
    const targetCollection = getCategoriaCollectionRef(tipo);
    const categoriaRef = doc(targetCollection, id);

    // Apenas atualiza o nome. A mudança de TIPO exigiria exclusão/criação em outra coleção.
    await updateDoc(categoriaRef, {
      ...(categoria.nome !== undefined && { nome: categoria.nome }),
      // O campo 'tipo' não deve ser editável após a criação na nova estrutura
    });
    console.log("Categoria atualizada com ID:", id);
  } catch (error) {
    console.error("Erro ao editar categoria:", error);
    throw error;
  }
}

// Excluir categoria
export async function deletarCategoria(id: string, tipo: "gasto" | "ganho") {
  try {
    const targetCollection = getCategoriaCollectionRef(tipo);
    const categoriaRef = doc(targetCollection, id);
    await deleteDoc(categoriaRef);
    console.log("Categoria deletada com ID:", id);
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    throw error;
  }
}

// Buscar categorias do usuário (Agora o 'tipo' é obrigatório)
export async function buscaCategoriasPorUsuario(
  userId: string,
  tipo: "gasto" | "ganho" // O tipo AGORA É OBRIGATÓRIO para escolher a coleção
): Promise<Categoria[]> {
  try {
    // 1. Seleciona a coleção correta
    const targetCollection = getCategoriaCollectionRef(tipo);

    // 2. Define as restrições (MUITO MAIS SIMPLES!)
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("nome", "asc"), // Requer apenas o índice (userId, nome)
    ];

    const q = query(targetCollection, ...constraints);

    const snapshot = await getDocs(q);
    console.log(
      `Documentos encontrados em ${tipo} para userId ${userId}:`,
      snapshot.docs.length
    );

    // Mapeamento dos documentos
    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        nome: data.nome,
        userId: data.userId,
        // O tipo é inferido pela coleção de origem, mas adicionado ao objeto Categoria
        tipo: tipo,
        criadoEm: data.criadoEm?.toDate(),
      } as Categoria;
    });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    throw error;
  }
}
