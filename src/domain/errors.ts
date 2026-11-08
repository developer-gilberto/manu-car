export type DomainErrorCode =
  'INVALID_DATE' | 'INVALID_ODOMETER' | 'INVALID_INTERVAL' | 'ODOMETER_DECREASED';

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidDateError extends DomainError {
  constructor(readonly value: string) {
    super('INVALID_DATE', `Data inválida: ${value}`);
  }
}

export class InvalidOdometerError extends DomainError {
  constructor(
    readonly value: number,
    readonly field: string,
  ) {
    super('INVALID_ODOMETER', `Odômetro inválido em ${field}: ${value}`);
  }
}

export class InvalidIntervalError extends DomainError {
  constructor(
    readonly value: number,
    readonly field: string,
  ) {
    super('INVALID_INTERVAL', `Intervalo inválido em ${field}: ${value}`);
  }
}

export class OdometerDecreasedError extends DomainError {
  constructor(
    readonly previousKm: number,
    readonly currentKm: number,
  ) {
    super('ODOMETER_DECREASED', `Odômetro diminuiu de ${previousKm} para ${currentKm}.`);
  }
}
