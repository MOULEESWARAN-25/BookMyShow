const { Client } = require("@opensearch-project/opensearch");

const opensearch = new Client({
  node: process.env.OPENSEARCH_URL || "http://localhost:9200",
});

module.exports = opensearch;
