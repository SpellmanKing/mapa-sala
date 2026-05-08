export function calcularCronograma({
  cargaHorariaTotal,
  dataInicio,
  turno,
  diasSemanaSelecionados,
  feriadosRecessosParam = [],
  porcentagemRemoto = 0
}) {
  let horasPorDia = 0;
  switch (turno) {
    case 'Manhã':
    case 'Tarde':
    case 'Noite':
      horasPorDia = 4;
      break;
    case 'Integral':
      horasPorDia = 8;
      break;
    case 'Vespertino':
      horasPorDia = 5;
      break;
    default:
      throw new Error('Turno inválido ou horas por dia não configuradas.');
  }

  if (horasPorDia <= 0) {
    throw new Error('Não foi possível determinar a carga horária diária.');
  }

  const totalDiasLetivos = Math.ceil(cargaHorariaTotal / horasPorDia);

  // Observação: o PHP tem uma referência inconsistente a diasLetivosNecessarios.
  // Para compatibilidade, mantemos apenas a lista de dias letivos ignorando remoto
  // (no contrato atual do controller/alocação, o que importa é diasLetivos e dataTermino).

  const currentDate = new Date(dataInicio + 'T00:00:00');
  const feriadosMap = new Set(feriadosRecessosParam);

  const diasLetivos = [];
  let totalDiasAula = 0;
  let dataTermino = null;

  while (totalDiasAula < totalDiasLetivos) {
    // getDay: 0=Domingo..6=Sábado. PHP usa N: 1=Seg..7=Dom.
    const day = currentDate.getDay();
    const diaDaSemanaPHP = day === 0 ? 7 : day; // 1..7

    const dataAtual = currentDate.toISOString().slice(0, 10);

    const isDiaDeAulaProgramado = diasSemanaSelecionados.includes(diaDaSemanaPHP);
    const isFeriadoOuRecesso = feriadosMap.has(dataAtual);

    if (isDiaDeAulaProgramado && !isFeriadoOuRecesso) {
      diasLetivos.push(dataAtual);
      totalDiasAula += 1;
      dataTermino = dataAtual;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    dataTermino,
    diasLetivos,
    totalDiasAula,
    horasPorDia
  };
}

