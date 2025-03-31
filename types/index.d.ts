import { ReactNode } from 'react';

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '@headlessui/react' {
  export const Disclosure: React.FC<{
    as?: keyof JSX.IntrinsicElements;
    children: ReactNode | ((props: { open: boolean }) => ReactNode);
    className?: string;
  }>;
  export const Menu: React.FC<{
    as?: keyof JSX.IntrinsicElements;
    children: ReactNode;
    className?: string;
  }>;
  export const Transition: React.FC<{
    as?: keyof JSX.IntrinsicElements;
    children: ReactNode;
    className?: string;
    show?: boolean;
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
  }>;
}

declare module '@heroicons/react/*' {
  export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArrowRightOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

declare module 'clsx' {
  const clsx: (...inputs: any[]) => string;
  export default clsx;
}

declare module 'next-themes' {
  export const useTheme: () => {
    theme: string;
    setTheme: (theme: string) => void;
  };
}

declare module 'next-auth/react' {
  export const useSession: () => {
    data: {
      user?: {
        name?: string;
        email?: string;
        image?: string;
      };
    };
    status: string;
  };
  export const signIn: (provider: string, options?: { callbackUrl: string }) => void;
  export const signOut: () => void;
}

declare module 'next/link' {
  import { LinkProps as NextLinkProps } from 'next/link';
  export default function NextLink(props: NextLinkProps): JSX.Element;
}

declare module 'next/navigation' {
  export const usePathname: () => string;
} 