module.exports = {
  plugins: [
    require('postcss-merge-rules')(),
    require('postcss-sort-media-queries')({
      sort: 'desktop-first'
    }),
    require('postcss-combine-duplicated-selectors')()
  ]
};
