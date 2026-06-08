import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const GAP = {
  s2: 'gap-[var(--s2)]',
  s1: 'gap-[var(--s1)]',
  s0: 'gap-[var(--s0)]',
  's-1': 'gap-[var(--s-1)]',
  's-2': 'gap-[var(--s-2)]',
} as const;

const PAD = {
  s2: 'p-[var(--s2)]',
  s1: 'p-[var(--s1)]',
  s0: 'p-[var(--s0)]',
  's-1': 'p-[var(--s-1)]',
  's-2': 'p-[var(--s-2)]',
} as const;

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;

const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

/* ---------- Box ---------- */
const boxVariants = cva('', {
  variants: { p: PAD },
});
export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants> {}
export function Box({ className, p, ...props }: BoxProps) {
  return <div className={cn(boxVariants({ p }), className)} {...props} />;
}

/* ---------- Stack (vertical) ---------- */
const stackVariants = cva('flex flex-col', {
  variants: { gap: GAP, align: ALIGN, justify: JUSTIFY },
});
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}
export function Stack({ className, gap, align, justify, ...props }: StackProps) {
  return <div className={cn(stackVariants({ gap, align, justify }), className)} {...props} />;
}

/* ---------- Flex (horizontal) ---------- */
const flexVariants = cva('flex', {
  variants: {
    gap: GAP,
    align: ALIGN,
    justify: JUSTIFY,
    wrap: { wrap: 'flex-wrap', nowrap: 'flex-nowrap' },
  },
});
export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {}
export function Flex({ className, gap, align, justify, wrap, ...props }: FlexProps) {
  return <div className={cn(flexVariants({ gap, align, justify, wrap }), className)} {...props} />;
}

/* ---------- Text ---------- */
const textVariants = cva('', {
  variants: {
    size: {
      small: 'text-sm',
      default: 'text-base',
      large: 'text-lg',
      xl: 'text-xl',
      xxl: 'text-2xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: { size: 'default', weight: 'normal', color: 'default' },
});
type TextElement = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
// Omit the native (non-standard) `color` HTML attribute so the CVA `color`
// variant's literal union type wins instead of colliding with `string`.
export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}
export function Text({ className, size, weight, color, as = 'p', ...props }: TextProps) {
  const Comp = as;
  return <Comp className={cn(textVariants({ size, weight, color }), className)} {...props} />;
}
