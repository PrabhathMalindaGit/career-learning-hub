const { cleanupTagged } = require("./fixtures.cjs");

module.exports = async function globalTeardown() {
  const result = await cleanupTagged();
  console.log(
    `Phase 14 final fixture counts: users=${result.taggedUsers}, owned=${result.ownedRecords}.`,
  );
  if (result.taggedUsers !== 0 || result.ownedRecords !== 0) {
    throw new Error("Phase 14 final fixture cleanup did not reach zero.");
  }
};
