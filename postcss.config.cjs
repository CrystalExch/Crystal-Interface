module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-combine-duplicated-selectors': {
      removeDuplicatedProperties: true
    }
  }
};