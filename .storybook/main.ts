import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/react-vite",
  staticDirs: [
    "../.github",
    // Serve the Turkish Hunspell dictionary locally so the spell-check
    // stories don't depend on the CDN.
    { from: "../node_modules/dictionary-tr", to: "/dictionaries/tr" },
  ],
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    return config;
  },
};

export default config;
