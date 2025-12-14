import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../config/firebase/firebase";
import {
  ganhosCollection,
  gastosCollection,
} from "../transacao/transacaoService";

export interface Fechamento {
  userId: string;
  periodo: string;
  totalGanhos: number;
  totalGastos: number;
  saldo: number;
  maiorGanho?: { descricao: string; valor: number };
  maiorGasto?: { descricao: string; valor: number };
  dataFechamento: Date;
}

const fechamentoCollection = collection(db, "fechamentoPeriodo");

function formatarDataParaId(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0"); // Mês é 0-indexado
  const ano = data.getFullYear();
  return `${dia}-${mes}-${ano}`;
}
// Buscar último fechamento do usuário
export async function buscaUltimoFechamento(
  userId: string
): Promise<Fechamento | null> {
  try {
    const q = query(
      fechamentoCollection,
      where("userId", "==", userId),
      orderBy("dataFechamento", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      userId: data.userId,
      periodo: data.periodo,
      totalGanhos: data.totalGanhos,
      totalGastos: data.totalGastos,
      saldo: data.saldo,
      maiorGanho: data.maiorGanho,
      maiorGasto: data.maiorGasto,
      dataFechamento: data.dataFechamento.toDate(),
    };
  } catch (error) {
    console.error("Erro ao buscar último fechamento:", error);
    throw error;
  }
}

export async function fecharPeriodo(
  userId: string,
  // O parâmetro 'periodo' não será mais usado diretamente como ID, mas pode ser útil para metadados
  // No entanto, para simplificar o ID, usaremos a data de FIM.
  periodo: string, // Mantido, mas não usado no ID
  inicio: Date,
  fim: Date // Usaremos esta data para gerar o ID
) {
  // --- GERAÇÃO DO ID ÚNICO COM DATA ---
  const dataFimFormatada = formatarDataParaId(fim);
  const fechamentoDocId = `${userId}-${dataFimFormatada}`;
  // ------------------------------------

  // Buscar abertos (Gastos)
  const gastosSnapshot = await getDocs(
    query(
      gastosCollection,
      where("userId", "==", userId),
      where("data", ">=", Timestamp.fromDate(inicio)),
      where("data", "<", Timestamp.fromDate(fim)),
      where("fechado", "==", false)
    )
  );

  // Buscar abertos (Ganhos)
  const ganhosSnapshot = await getDocs(
    query(
      ganhosCollection,
      where("userId", "==", userId),
      where("data", ">=", Timestamp.fromDate(inicio)),
      where("data", "<", Timestamp.fromDate(fim)),
      where("fechado", "==", false)
    )
  );

  const gastos = gastosSnapshot.docs.map((d) => d.data());
  const ganhos = ganhosSnapshot.docs.map((d) => d.data());

  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
  const totalGanhos = ganhos.reduce((acc, g) => acc + g.valor, 0);
  const saldo = totalGanhos - totalGastos;

  // Lógica para Maior Gasto/Ganho (Apenas se houver dados)
  const maiorGasto =
    gastos.length > 0
      ? gastos.reduce((max, g) => (g.valor > max.valor ? g : max), gastos[0])
      : null; // Garante que não falha se a lista estiver vazia

  const maiorGanho =
    ganhos.length > 0
      ? ganhos.reduce((max, g) => (g.valor > max.valor ? g : max), ganhos[0])
      : null; // Garante que não falha se a lista estiver vazia

  // 🔑 Aplica o novo ID baseado na data de fim
  const fechamentoRef = doc(fechamentoCollection, fechamentoDocId);
  const fechamentoSnap = await getDoc(fechamentoRef);

  if (fechamentoSnap.exists()) {
    // Atualiza acumulando
    const dadosExistentes = fechamentoSnap.data();

    // Nota: É importante garantir que maiorGasto/Ganho não sejam null ao atualizar.
    // Esta lógica de acumulação de maior valor é complexa e pode precisar de revisão,
    // mas estamos mantendo a estrutura original aqui, ajustando apenas o ID.
    const novoMaiorGasto =
      (maiorGasto?.valor || 0) > (dadosExistentes.maiorGasto?.valor || 0)
        ? maiorGasto
        : dadosExistentes.maiorGasto;
    const novoMaiorGanho =
      (maiorGanho?.valor || 0) > (dadosExistentes.maiorGanho?.valor || 0)
        ? maiorGanho
        : dadosExistentes.maiorGanho;

    await updateDoc(fechamentoRef, {
      totalGastos: dadosExistentes.totalGastos + totalGastos,
      totalGanhos: dadosExistentes.totalGanhos + totalGanhos,
      saldo: dadosExistentes.saldo + saldo,
      maiorGasto: novoMaiorGasto, // Atualiza para o maior dos dois períodos
      maiorGanho: novoMaiorGanho, // Atualiza para o maior dos dois períodos
      dataFechamento: Timestamp.now(),
    });
  } else {
    // Cria novo
    await setDoc(fechamentoRef, {
      userId,
      periodo, // O período original é mantido como metadado
      totalGastos,
      totalGanhos,
      saldo,
      maiorGasto,
      maiorGanho,
      dataFechamento: Timestamp.now(),
    });
  }

  // Marcar transações como fechadas (Batch Write)
  const batch = writeBatch(db);
  gastosSnapshot.docs.forEach((doc) =>
    batch.update(doc.ref, { fechado: true })
  );
  ganhosSnapshot.docs.forEach((doc) =>
    batch.update(doc.ref, { fechado: true })
  );
  await batch.commit();
}

export async function buscaFechamentoPorPeriodo(
  userId: string,
  periodo: Date // 🔑 MUDANÇA: Agora aceita um objeto Date
): Promise<Fechamento | null> {
  // 🔑 1. Formata o objeto Date para a string ID (DD-MM-AAAA)
  const dataFimFormatada = formatarDataParaId(periodo);

  // 2. Constrói o ID do documento
  const fechamentoDocId = `${userId}-${dataFimFormatada}`;

  const fechamentoRef = doc(fechamentoCollection, fechamentoDocId);
  const snap = await getDoc(fechamentoRef);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    userId: data.userId,
    // O período salvo no DB é o original (se foi salvo como string) ou o período (data) usado aqui
    // Se o campo 'periodo' no DB for uma string descritiva, mantenha data.periodo.
    // Se você só usa este campo, dataFimFormatada seria mais coerente.
    periodo: data.periodo,
    totalGanhos: data.totalGanhos,
    totalGastos: data.totalGastos,
    saldo: data.saldo,
    maiorGanho: data.maiorGanho,
    maiorGasto: data.maiorGasto,
    dataFechamento: data.dataFechamento.toDate(),
  };
}
