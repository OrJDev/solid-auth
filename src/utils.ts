import { Session } from "@auth/core/types";

export interface InternalUrl {
  origin: string;
  host: string;
  path: string;
  base: string;
  toString: () => string;
}

export function parseUrl(url?: string | URL): InternalUrl {
  const defaultUrl = new URL("http://localhost:3000/api/auth");

  if (url && !url.toString().startsWith("http")) {
    url = `https://${url}`;
  }

  const _url = new URL(url ?? defaultUrl);
  const path = (
    _url.pathname === "/" ? defaultUrl.pathname : _url.pathname
  ).replace(/\/$/, "");

  const base = `${_url.origin}${path}`;

  return {
    origin: _url.origin,
    host: _url.host,
    path,
    base,
    toString: () => base,
  };
}

export function now() {
  return Math.floor(Date.now() / 1000);
}

export function objectIsSession(obj: any): obj is Session {
  return obj && Object.keys(obj).length > 0;
}
