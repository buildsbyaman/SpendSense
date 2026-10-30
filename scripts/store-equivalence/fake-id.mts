let counter = 0;

export function newId() {
  counter += 1;
  return `test-id-${counter}`;
}

globalThis.__resetTestIds = () => {
  counter = 0;
};
