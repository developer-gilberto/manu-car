const MAINTENANCE_ITEM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  'óleo do motor':
    'Lubrifica e refrigera o motor, reduz o desgaste das peças móveis e ajuda a manter o desempenho e a economia de combustível.',
  'filtro de óleo':
    'Retém impurezas e partículas metálicas do óleo. Mantê-lo em dia protege o motor e evita desgaste prematuro.',
  'filtro de ar':
    'Filtra o ar que entra no motor. Limpo, garante a mistura correta, melhora o consumo e reduz emissões.',
  'filtro de combustível':
    'Retém sujeira e água do combustível. Protege a injeção e a bomba, evitando falhas e perda de potência.',
  'filtro de cabine':
    'Filtra o ar que entra na cabine. Melhora a qualidade do ar e reduz odores, poeira e agentes alergênicos.',
  'limpeza do sensor map':
    'Remove resíduos do sensor de pressão do coletor. Garante a leitura correta da admissão, o consumo e a resposta do motor.',
  'limpeza do sensor maf':
    'Limpa o sensor de fluxo de ar. Mantém a medição de ar precisa, evitando marcha irregular e aumento do consumo.',
  'limpeza da sonda lambda':
    'Remove depósitos da sonda de oxigênio. Preserva o controle da mistura, reduz o consumo e as emissões.',
  'correia dentada':
    'Sincroniza o motor e aciona componentes. A troca no prazo evita uma quebra grave e danos caros.',
  'velas de ignição':
    'Geram a faísca que queima o combustível. Em bom estado, garantem partida fácil, marcha lenta estável e menor consumo.',
  'pastilhas de freio':
    'São responsáveis pela frenagem. A troca no prazo mantém a distância de parada e a segurança.',
  'fluido de freio':
    'Transmite a força do pedal aos freios e absorve umidade. Trocado no prazo, evita perda de eficiência e falha na frenagem.',
  'líquido de arrefecimento':
    'Controla a temperatura do motor. Mantém a refrigeração e evita superaquecimento e corrosão.',
  'rodízio de pneus':
    'Alterna a posição dos pneus. Distribui o desgaste, prolonga a vida útil e melhora a estabilidade.',
  'alinhamento/balanceamento':
    'Corrige a direção e as vibrações. Proporciona dirigibilidade segura, menos desgaste e mais conforto.',
  bateria:
    'Fornece energia para a partida e os sistemas elétricos. Em bom estado, evita pane e partidas difíceis.',
};

const NORMALIZED_DESCRIPTIONS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MAINTENANCE_ITEM_DESCRIPTIONS).map(([name, description]) => [
    name.trim().toLowerCase(),
    description,
  ]),
);

export function getMaintenanceItemDescription(name: string): string | null {
  return NORMALIZED_DESCRIPTIONS[name.trim().toLowerCase()] ?? null;
}
