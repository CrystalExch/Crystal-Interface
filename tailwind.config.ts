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
    "btn-primary": createColorSet("#aaaecf", "#aaaecf"),
    "fg-disabled": createColorSet("#475569", "#475569"),
    "fg-invert": createColorSet("#020617", "#020617"),
    "fg-primary": createColorSet("#fff", "fff"),
    "fg-accent-brand": createColorSet("#aaaecf", "#aaaecf"),
    "bg-surface-default": createColorSet("#aaaecf", "#0f0f12"),
    "bg-surface-inset": createColorSet("#aaaecf", "#aaaecf30"),
  },
})