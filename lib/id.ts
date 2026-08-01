let _counter = 0;

export function newId(): string {
  return `${Date.now()}-${++_counter}-${Math.random().toString(36).slice(2, 8)}`;
}
