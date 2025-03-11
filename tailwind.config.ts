import { withAccountKitUi, createColorSet } from "@account-kit/react/tailwind";

// wrap your existing tailwind config with 'withAccountKitUi'
export default withAccountKitUi({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('postcss-merge-rules')(),
    require('postcss-sort-media-queries')({
      sort: 'desktop-first'
    }),
    require('postcss-combine-duplicated-selectors')()
  ],
  corePlugins: {
    preflight: true,
  },
}, {
  // override account kit themes
  colors: {
    "btn-primary": createColorSet("#E82594", "#aaaecf"),
    "fg-accent-brand": createColorSet("#E82594", "#aaaecf"),
  },
})