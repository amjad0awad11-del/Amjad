"use client";

import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { isPlaceholder } from "@/lib/placeholder";

/**
 * Renders a link, unless its href is still a [[PLACEHOLDER]] — in which case it
 * renders as inert text instead of a route that 404s. The token stays visible so
 * the missing value is obvious.
 */
export function SmartLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick" | "className">) {
  if (isPlaceholder(href) || href.includes("[[")) {
    return (
      <span
        className={clsx(className, "cursor-not-allowed opacity-70")}
        title="Platzhalter — echte URL eintragen"
        data-placeholder="href"
      >
        {children}
      </span>
    );
  }

  const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

  if (external) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
