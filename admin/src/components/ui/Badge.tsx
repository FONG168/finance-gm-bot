import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/20 text-red-400',
        outline: 'text-foreground',
        success: 'border-green-500/30 bg-green-500/20 text-green-400',
        warning: 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400',
        purple: 'border-purple-500/30 bg-purple-500/20 text-purple-400',
        blue: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
        gray: 'border-gray-500/30 bg-gray-500/20 text-gray-400',
        orange: 'border-orange-500/30 bg-orange-500/20 text-orange-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
