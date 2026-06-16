import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

/** Storybook: next/link 대체 */
export default function Link({ href, children, className }: Props) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
