import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  primaryShade: 6,
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
    fontWeight: '600',
  },
  cursorType: 'pointer',
  components: {
    Card: {
      defaultProps: {
        shadow: 'xs',
        radius: 'lg',
        withBorder: true,
      },
    },
  },
});
