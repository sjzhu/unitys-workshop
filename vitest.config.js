const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/js/**/*.test.js"],
    clearMocks: true,
  },
});
