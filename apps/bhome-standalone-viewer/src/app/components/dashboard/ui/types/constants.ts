export type Appearance =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'light'
  | 'dark';

  const Sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'] as const;
  export type Size = (typeof Sizes)[number];

  export enum WorkstationType {
    EXECUTE = 'EXECUTE',
    INSPECT = 'INSPECT',
  }