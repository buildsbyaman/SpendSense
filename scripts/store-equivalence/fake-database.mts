export async function getDatabase() {
  return {
    withTransactionAsync: async (work) => work(),
  };
}
