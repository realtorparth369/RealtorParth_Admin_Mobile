import { Link, type Href } from "expo-router";
import { type PropsWithChildren } from "react";

export function ExternalLink({
  href,
  ...rest
}: PropsWithChildren<{ href: string }>) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as Href}
    />
  );
}