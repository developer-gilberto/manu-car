import {
  kmToInput,
  maskCurrencyInput,
  maskDateInput,
  maskIntegerInput,
  maskKmInput,
  maskMonthsInput,
  maskPlateInput,
  maskTimeUnitInput,
  unmaskDigits,
} from '../input-masks';

describe('unmaskDigits', () => {
  it('mantém só os dígitos', () => {
    expect(unmaskDigits('R$ 1.234,56')).toBe('123456');
    expect(unmaskDigits('')).toBe('');
  });
});

describe('maskKmInput', () => {
  it('agrupa milhares', () => {
    expect(maskKmInput('52000')).toBe('52.000');
    expect(maskKmInput('1234567')).toBe('1.234.567');
    expect(maskKmInput('999')).toBe('999');
  });

  it('remove letras e zeros à esquerda', () => {
    expect(maskKmInput('0052a')).toBe('52');
    expect(maskKmInput('0')).toBe('0');
    expect(maskKmInput('')).toBe('');
  });

  it('limita a 9 dígitos', () => {
    expect(maskKmInput('12345678901')).toBe('123.456.789');
  });

  it('volta a formatar ao apagar um dígito', () => {
    expect(maskKmInput('52.00')).toBe('5.200');
    expect(maskKmInput('5.200')).toBe('5.200');
  });
});

describe('kmToInput', () => {
  it('formata um valor salvo para exibição', () => {
    expect(kmToInput(52000)).toBe('52.000');
    expect(kmToInput(0)).toBe('0');
  });

  it('retorna vazio para ausência de valor', () => {
    expect(kmToInput(null)).toBe('');
    expect(kmToInput(undefined)).toBe('');
  });
});

describe('maskIntegerInput and related', () => {
  it('limita o número de dígitos', () => {
    expect(maskIntegerInput('12345', 3)).toBe('123');
    expect(maskMonthsInput('1234')).toBe('123');
    expect(maskTimeUnitInput('7a8')).toBe('78');
  });
});

describe('maskDateInput', () => {
  it('insere as barras à medida que digita', () => {
    expect(maskDateInput('0')).toBe('0');
    expect(maskDateInput('08')).toBe('08');
    expect(maskDateInput('081')).toBe('08/1');
    expect(maskDateInput('0811')).toBe('08/11');
    expect(maskDateInput('08112')).toBe('08/11/2');
    expect(maskDateInput('08112026')).toBe('08/11/2026');
  });

  it('limita a 8 dígitos e ignora letras', () => {
    expect(maskDateInput('08112026999')).toBe('08/11/2026');
    expect(maskDateInput('0a8/1b1')).toBe('08/11');
  });

  it('ao apagar a barra, mantém só os dígitos', () => {
    expect(maskDateInput('08/')).toBe('08');
    expect(maskDateInput('08/11/')).toBe('08/11');
  });
});

describe('maskCurrencyInput', () => {
  it('trata a entrada como centavos', () => {
    expect(maskCurrencyInput('5')).toBe('R$ 0,05');
    expect(maskCurrencyInput('12345')).toBe('R$ 123,45');
    expect(maskCurrencyInput('123456')).toBe('R$ 1.234,56');
  });

  it('retorna vazio quando não há dígitos', () => {
    expect(maskCurrencyInput('')).toBe('');
    expect(maskCurrencyInput('R$ ')).toBe('');
  });

  it('remove zeros à esquerda', () => {
    expect(maskCurrencyInput('000')).toBe('R$ 0,00');
    expect(maskCurrencyInput('0250')).toBe('R$ 2,50');
  });

  it('volta ao valor anterior ao apagar um dígito', () => {
    expect(maskCurrencyInput('R$ 1,2')).toBe('R$ 0,12');
    expect(maskCurrencyInput('R$ 0,1')).toBe('R$ 0,01');
    expect(maskCurrencyInput('R$ 0,12')).toBe('R$ 0,12');
  });
});

describe('maskPlateInput', () => {
  it('converte para maiúsculas e remove símbolos', () => {
    expect(maskPlateInput('abc-1d23')).toBe('ABC1D23');
  });

  it('limita a 7 caracteres', () => {
    expect(maskPlateInput('abc1d23456')).toBe('ABC1D23');
  });

  it('aceita placa antiga', () => {
    expect(maskPlateInput('abc1234')).toBe('ABC1234');
  });
});
