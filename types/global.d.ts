/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '@headlessui/react' {
  import { ReactNode } from 'react';

  interface DisclosureProps {
    as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
    children: ReactNode | ((props: { open: boolean }) => ReactNode);
    className?: string;
  }

  interface MenuProps {
    as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
    children: ReactNode;
    className?: string;
  }

  interface TransitionProps {
    as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
    children: ReactNode;
    className?: string;
    show?: boolean;
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
  }

  export const Disclosure: React.FC<DisclosureProps> & {
    Button: React.FC<DisclosureProps>;
    Panel: React.FC<DisclosureProps>;
  };

  export const Menu: React.FC<MenuProps> & {
    Button: React.FC<MenuProps>;
    Items: React.FC<MenuProps>;
    Item: React.FC<MenuProps & {
      children: (props: { active: boolean }) => ReactNode;
    }>;
  };

  export const Transition: React.FC<TransitionProps>;
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
  const NextLink: React.FC<NextLinkProps & { children: React.ReactNode }>;
  export default NextLink;
}

declare module 'next/navigation' {
  export const usePathname: () => string;
}

export {}; 