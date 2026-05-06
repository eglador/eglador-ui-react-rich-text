import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    layout: "padded",
    options: {
      storySort: {
        order: ["Welcome", "Installation", "Getting Started", "Rich Text"],
      },
    },
  },
};

export default preview;
