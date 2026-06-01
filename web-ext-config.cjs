module.exports = {
  verbose: false,
  ignoreFiles: [
    "package.json",
    "package-lock.json",
    "web-ext-config.js",
    "web-ext-config.cjs",
    ".web-ext-config.json",
    ".git",
    ".gitignore",
    "*.md",
    "graphify-out",
    "graphify-out/**",
    "graphify-out/**/*",
    "CLAUDE.md",
    "README.md"
  ],
  build: {
    overwriteDest: true
  }
};
