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
    "btn-primary": createColorSet("#19191c80", "#aaaecf"),
    "fg-accent-brand": createColorSet("#19191c80", "#aaaecf"),
    "bg-surface-default": createColorSet("#19191c80", "#0f0f12"),
    "bg-surface-inset": createColorSet("#19191c80", "#aaaecf30"),
  },
})