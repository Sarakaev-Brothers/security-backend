// Нужна функция что будет делать типа (15, 'm') => '15m'

import { StringValue } from 'ms';

export function formatMs(ms: number, unit: 'm' | 'h' | 'd'): StringValue {
  return `${ms}${unit}`;
}
