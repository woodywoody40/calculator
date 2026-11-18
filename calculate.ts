import { Decimal } from 'decimal.js';

const Amount = Decimal.clone({ precision: 160 });

export function calculate(input: string): Decimal | null {
  const expression = input.replace(/[+*/-]$/, '');
  if (!/^-?(?:\d+\.?\d*|\.\d+)(?:[+*/-](?:\d+\.?\d*|\.\d+))*$/.test(expression)) return null;
  const tokens = expression.match(/\d+\.?\d*|\.\d+|[+*/-]/g)!;
  let index = expression.startsWith('-') ? 1 : 0;
  let term = new Amount(tokens[index++]);
  if (expression.startsWith('-')) term = term.neg();
  let sum = new Amount(0);
  while (index < tokens.length) {
    const operator = tokens[index++];
    const value = new Amount(tokens[index++]);
    if (operator === '*') term = term.mul(value);
    else if (operator === '/') term = term.div(value);
    else {
      sum = sum.plus(term);
      term = operator === '-' ? value.neg() : value;
    }
  }
  const result = sum.plus(term);
  return result.isFinite() && Math.abs(result.e) < 128 ? result : null;
}
