module.exports = {
  "presets": [
    [
      "@babel/env",
      {
        "targets": {
          "node": "current"
        }
      }
    ],
  ],
  "plugins": [
    ["@babel/plugin-proposal-class-properties"],
    ['@babel/plugin-proposal-optional-chaining']
  ]
}