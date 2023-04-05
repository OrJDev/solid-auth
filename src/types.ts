/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Session } from "@auth/core/types";
import type { Accessor, JSX } from "solid-js";

export interface AuthClientConfig {
  baseUrl: string;
  basePath: string;
  baseUrlServer: string;
  basePathServer: string;
  _session?: Session | null | undefined;
  _lastSync: number;
  _getSession: (...args: any[]) => any;
}

export interface SessionProviderProps {
  children: JSX.Element;
  session?: Session | null;
  baseUrl?: string;
  basePath?: string;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export interface CreateSessionOptions<R extends boolean> {
  required: R;
  onUnauthenticated?: () => void;
}

export type SessionContextInner<R extends boolean = false> = R extends true
  ?
      | { data: Session; status: "authenticated" }
      | { data: null; status: "loading" }
  :
      | { data: Session; status: "authenticated" }
      | { data: null; status: "unauthenticated" | "loading" };
export type SessionContextValue<R extends boolean = false> = Accessor<
  SessionContextInner<R>
>;

export type LiteralUnion<T extends U, U = string> =
  | T
  | (U & Record<never, never>);

export interface SignInOptions extends Record<string, unknown> {
  redirectTo?: string;
  redirect?: boolean;
}

export type SignInAuthorizationParams =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams;

export interface SignOutParams<R extends boolean = true> {
  redirectTo?: string;
  redirect?: R;
}
