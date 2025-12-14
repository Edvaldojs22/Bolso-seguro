// import { useEffect, useState } from "react";
// import {
//   buscaUltimoFechamento,
//   buscaFechamentoPorPeriodo,
//   type Fechamento,
//   fecharPeriodo,
// } from "../../services/fechamento/fechamentoService";
// import { useAuth } from "../../auth/AuthProvider";

// // Função utilitária para formatar valores monetários (melhora a visualização)
// const formatarMoeda = (valor: number) => {
//   return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// };

// // Função utilitária para formatar data (melhora a visualização)
// const formatarData = (data: Date | undefined) => {
//   return data ? data.toLocaleDateString("pt-BR") : "N/A";
// };

// const Relatorio = () => {
//   const { user, loading } = useAuth();
//   const [fechamento, setFechamento] = useState<Fechamento | null>(null);
//   // O estado 'periodoBusca' é uma string de data (YYYY-MM-DD) do input.
//   const [periodoBusca, setPeriodoBusca] = useState<string>("");
//   const [dataRelatorio, setDataRelatorio] = useState<string>(
//     "Último Período Fechado"
//   );

//   // Carrega o último fechamento ao iniciar
//   useEffect(() => {
//     if (!loading && user) {
//       (async () => {
//         try {
//           const ultimo = await buscaUltimoFechamento(user.uid);
//           setFechamento(ultimo);
//           if (ultimo) {
//             setDataRelatorio(
//               `Período Fechado em ${formatarData(ultimo.dataFechamento)}`
//             );
//           }
//         } catch (error) {
//           console.error("Erro ao carregar último fechamento:", error);
//         }
//       })();
//     }
//   }, [user, loading]);

//   async function handleBuscarPeriodo() {
//     if (!user || !periodoBusca) {
//       alert("Por favor, selecione uma data válida para busca.");
//       return;
//     }

//     try {
//       // Converte a string 'YYYY-MM-DD' do input para objeto Date
//       const dataBusca = new Date(periodoBusca + "T00:00:00");

//       // buscaFechamentoPorPeriodo espera um objeto Date como parâmetro 'periodo'
//       const resultado = await buscaFechamentoPorPeriodo(user.uid, dataBusca);

//       setFechamento(resultado);
//       if (resultado) {
//         setDataRelatorio(`Relatório de ${formatarData(dataBusca)}`);
//       } else {
//         setDataRelatorio(
//           `Nenhum relatório encontrado para ${formatarData(dataBusca)}`
//         );
//       }
//     } catch (error) {
//       console.error("Erro ao buscar fechamento:", error);
//       alert("Não foi possível buscar o relatório. Verifique a data.");
//     }
//   }

//   if (loading) return <p className="text-center p-8">Carregando...</p>;

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 md:p-10">
//       <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-2">
//         📊 Relatórios Financeiros
//       </h1>

//       {/* Seção de Ações */}
//       <div className="bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-center gap-4">
//         {/* Botão Fechar Período */}
//         <button
//           onClick={handleFecharPeriodo}
//           className="w-full md:w-auto bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md"
//         >
//           ✅ Fechar Período Atual
//         </button>

//         {/* Input buscar por período */}
//         <div className="flex w-full md:w-auto gap-2">
//           <input
//             type="date"
//             value={periodoBusca}
//             onChange={(e) => setPeriodoBusca(e.target.value)}
//             className="border border-gray-300 px-4 py-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
//           />
//           <button
//             onClick={handleBuscarPeriodo}
//             className="bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition shadow-md whitespace-nowrap"
//           >
//             🔍 Buscar
//           </button>
//         </div>
//       </div>

//       {/* Título do Relatório Exibido */}
//       <h2 className="text-2xl font-bold text-gray-700 mb-6">{dataRelatorio}</h2>

//       {/* Conteúdo do Relatório */}
//       <div className="space-y-6">
//         {!fechamento ? (
//           <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
//             <p className="font-semibold">
//               Nenhum relatório encontrado para o período.
//             </p>
//             <p className="text-sm">
//               Feche o período atual ou utilize a busca para períodos anteriores.
//             </p>
//           </div>
//         ) : (
//           <>
//             {/* Cards de Resumo Principal (Total de Ganhos, Gastos e Saldo) */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//               {/* Card de Ganhos */}
//               <Card
//                 title="Total de Ganhos"
//                 value={formatarMoeda(fechamento.totalGanhos)}
//                 color="bg-green-100 text-green-800"
//                 icon="⬆️"
//               />

//               {/* Card de Gastos */}
//               <Card
//                 title="Total de Gastos"
//                 value={formatarMoeda(fechamento.totalGastos)}
//                 color="bg-red-100 text-red-800"
//                 icon="⬇️"
//               />

//               {/* Card de Saldo */}
//               <Card
//                 title="Saldo do Período"
//                 value={formatarMoeda(fechamento.saldo)}
//                 color={
//                   fechamento.saldo >= 0
//                     ? "bg-blue-100 text-blue-800"
//                     : "bg-red-200 text-red-900"
//                 }
//                 icon="💰"
//               />
//             </div>

//             {/* Detalhes Adicionais (Maior Gasto e Maior Ganho) */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Card Maior Ganho */}
//               {fechamento.maiorGanho && (
//                 <Card
//                   title="📈 Maior Ganho Único"
//                   value={formatarMoeda(fechamento.maiorGanho.valor)}
//                   subtitle={fechamento.maiorGanho.descricao}
//                   color="bg-green-50 border-l-4 border-green-400"
//                   textClassName="text-green-700"
//                 />
//               )}

//               {/* Card Maior Gasto */}
//               {fechamento.maiorGasto && (
//                 <Card
//                   title="📉 Maior Gasto Único"
//                   value={formatarMoeda(fechamento.maiorGasto.valor)}
//                   subtitle={fechamento.maiorGasto.descricao}
//                   color="bg-red-50 border-l-4 border-red-400"
//                   textClassName="text-red-700"
//                 />
//               )}
//             </div>

//             <p className="pt-4 text-sm text-gray-500">
//               Dados atualizados em: {formatarData(fechamento.dataFechamento)}
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// // Componente Card Reutilizável
// interface CardProps {
//   title: string;
//   value: string;
//   subtitle?: string;
//   color: string;
//   icon?: string;
//   textClassName?: string;
// }

// const Card = ({
//   title,
//   value,
//   subtitle,
//   color,
//   icon,
//   textClassName = "text-gray-900",
// }: CardProps) => (
//   <div
//     className={`p-5 rounded-xl shadow-md ${color} flex flex-col justify-between h-full`}
//   >
//     <div className="flex items-center justify-between mb-2">
//       <h3 className="text-md font-semibold text-gray-600">{title}</h3>
//       {icon && <span className="text-2xl">{icon}</span>}
//     </div>
//     <p className={`text-3xl font-extrabold ${textClassName}`}>{value}</p>
//     {subtitle && (
//       <p className="text-sm mt-1 text-gray-500 italic truncate">{subtitle}</p>
//     )}
//   </div>
// );

// export default Relatorio;
