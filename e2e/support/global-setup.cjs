const { cleanupTagged } = require("./fixtures.cjs");

module.exports = async function globalSetup() {
  const result = await cleanupTagged();
  if (result.taggedUsers !== 0 || result.ownedRecords !== 0) {
    throw new Error("Phase 14 initial fixture cleanup did not reach zero.");
  }
  console.log("Phase 14 initial fixture counts: users=0, owned=0.");
};
