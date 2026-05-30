import { createTheme } from '@mantine/core';

const PIXEL = 'var(--font-pixel), "VT323", monospace';

export const theme = createTheme({
  primaryColor: 'violet',
  primaryShade: { light: 5, dark: 4 },
  defaultRadius: 0,
  fontFamily: PIXEL,
  fontFamilyMonospace: PIXEL,
  headings: { fontFamily: PIXEL, fontWeight: '400' },
  cursorType: 'pointer',
  fontSizes: {
    xs:  '14px',
    sm:  '16px',
    md:  '18px',
    lg:  '20px',
    xl:  '24px',
  },
  lineHeights: {
    xs: '1.3', sm: '1.3', md: '1.3', lg: '1.3', xl: '1.3',
  },
  components: {
    Card:             { defaultProps: { radius: 0, withBorder: true, shadow: 'none' } },
    Button:           { defaultProps: { radius: 0 } },
    TextInput:        { defaultProps: { radius: 0 } },
    PasswordInput:    { defaultProps: { radius: 0 } },
    NumberInput:      { defaultProps: { radius: 0 } },
    Select:           { defaultProps: { radius: 0 } },
    Textarea:         { defaultProps: { radius: 0 } },
    Badge:            { defaultProps: { radius: 0 } },
    Paper:            { defaultProps: { radius: 0 } },
    Alert:            { defaultProps: { radius: 0 } },
    Tooltip:          { defaultProps: { radius: 0 } },
    Modal:            { defaultProps: { radius: 0 } },
    DateInput:        { defaultProps: { radius: 0 } },
    MonthPickerInput: { defaultProps: { radius: 0 } },
  },
});
