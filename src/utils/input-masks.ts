/**
 * Máscaras de entrada. Cada função recebe o texto digitado e devolve o texto
 * formatado para exibir. Funções puras, sem dependência de React.
 */

const KM_MAX_DIGITS = 9;
const INTEGER_UNIT_MAX_DIGITS = 2;
const MONTHS_MAX_DIGITS = 3;
const CURRENCY_MAX_DIGITS = 10;
const PLATE_MAX_LENGTH = 7;
const DATE_MAX_DIGITS = 8;

/** Remove tudo que não é dígito. */
export function unmaskDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Remove zeros à esquerda, mantendo ao menos um dígito. */
function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+(?=\d)/, '');
}

/** Agrupa milhares com ponto: 52000 -> 52.000. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Quilometragem: só dígitos, com separador de milhar. Ex.: 52.000. */
export function maskKmInput(value: string): string {
  const digits = stripLeadingZeros(unmaskDigits(value)).slice(0, KM_MAX_DIGITS);

  return groupThousands(digits);
}

/** Número inteiro simples, limitado a `maxDigits` dígitos. */
export function maskIntegerInput(value: string, maxDigits: number): string {
  return unmaskDigits(value).slice(0, maxDigits);
}

/** Intervalo em meses (até 3 dígitos). */
export function maskMonthsInput(value: string): string {
  return maskIntegerInput(value, MONTHS_MAX_DIGITS);
}

/** Hora ou minuto (até 2 dígitos). */
export function maskTimeUnitInput(value: string): string {
  return maskIntegerInput(value, INTEGER_UNIT_MAX_DIGITS);
}

/** Data DD/MM/AAAA, inserindo as barras conforme o usuário digita. */
export function maskDateInput(value: string): string {
  const digits = unmaskDigits(value).slice(0, DATE_MAX_DIGITS);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Valor monetário em reais digitado como centavos: "5" -> "R$ 0,05",
 * "123456" -> "R$ 1.234,56". Campo vazio continua vazio.
 */
export function maskCurrencyInput(value: string): string {
  const digits = stripLeadingZeros(unmaskDigits(value)).slice(0, CURRENCY_MAX_DIGITS);

  if (digits === '') {
    return '';
  }

  const cents = digits.padStart(3, '0');
  const reais = groupThousands(cents.slice(0, -2));
  const centavos = cents.slice(-2);

  return `R$ ${reais},${centavos}`;
}

/** Placa: maiúsculas e alfanuméricos, até 7 caracteres (ABC1D23 ou ABC1234). */
export function maskPlateInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, PLATE_MAX_LENGTH);
}

/** Valor inicial de um campo de km a partir de um número salvo. */
export function kmToInput(km: number | null | undefined): string {
  return typeof km === 'number' ? maskKmInput(String(km)) : '';
}
