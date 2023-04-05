/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable solid/reactivity */
import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from "@auth/core/providers";
import type { Session } from "@auth/core/types";
import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
  createMemo,
} from "solid-js";
import type {
  SessionProviderProps,
  SessionContextInner,
  LiteralUnion,
  SignInOptions,
  SignInAuthorizationParams,
  SignOutParams,
  AuthClientConfig,
} from "./types";
import { now } from "./utils";
import { parseUrl } from "./utils";

export const __SOLIDAUTH: AuthClientConfig = {
  baseUrl: parseUrl(process.env.AUTH_URL ?? process.env.VERCEL_URL).origin,
  basePath: parseUrl(process.env.AUTH_URL).path,
  baseUrlServer: parseUrl(
    process.env.AUTH_URL_INTERNAL ??
      process.env.AUTH_URL ??
      process.env.VERCEL_URL
  ).origin,
  basePathServer: parseUrl(
    process.env.AUTH_URL_INTERNAL ?? process.env.AUTH_URL
  ).path,
  _lastSync: 0,
  _session: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _getSession: () => {},
};

export const SessionContext = createContext<SessionContextInner | undefined>(
  undefined
);

export function createSession(): Accessor<SessionContextInner> {
  // @ts-expect-error Satisfy TS if branch on line below
  const value: SessionContextValue<R> = useContext(SessionContext);
  if (!value && (import.meta as any).env.DEV) {
    throw new Error(
      "[@solid-auth/base]: `createSession` must be wrapped in a <SessionProvider />"
    );
  }

  return value;
}

export function SessionProvider(props: SessionProviderProps) {
  const { basePath, refetchInterval } = props;
  if (basePath) __SOLIDAUTH.basePath = basePath;
  const hasInitialSession = props.session !== undefined;
  __SOLIDAUTH._lastSync = hasInitialSession ? now() : 0;
  const [session, setSession] = createSignal(
    (() => {
      if (hasInitialSession) {
        __SOLIDAUTH._session = props.session;
      }
      return props.session;
    })()
  );
  const [loading, setLoading] = createSignal(!hasInitialSession);

  createEffect(() => {
    __SOLIDAUTH._getSession = async ({ event } = {}) => {
      try {
        const storageEvent = event === "storage";
        if (storageEvent || __SOLIDAUTH._session === undefined) {
          __SOLIDAUTH._lastSync = now();
          __SOLIDAUTH._session = await getSession();
          setSession(__SOLIDAUTH._session);
          return;
        }

        if (
          !event ||
          __SOLIDAUTH._session === null ||
          now() < __SOLIDAUTH._lastSync
        ) {
          return;
        }

        __SOLIDAUTH._lastSync = now();
        __SOLIDAUTH._session = await getSession();
        setSession(__SOLIDAUTH._session);
      } finally {
        setLoading(false);
        return __SOLIDAUTH._session;
      }
    };
    __SOLIDAUTH._getSession();

    onCleanup(() => {
      __SOLIDAUTH._lastSync = 0;
      __SOLIDAUTH._session = undefined;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      __SOLIDAUTH._getSession = () => {};
    });
  });

  createEffect(() => {
    const { refetchOnWindowFocus = true } = props;
    const visibilityHandler = () => {
      if (refetchOnWindowFocus && document.visibilityState === "visible")
        __SOLIDAUTH._getSession({ event: "visibilitychange" });
    };
    document.addEventListener("visibilitychange", visibilityHandler, false);
    onCleanup(() =>
      document.removeEventListener("visibilitychange", visibilityHandler, false)
    );
  });

  createEffect(() => {
    if (refetchInterval) {
      const refetchIntervalTimer = setInterval(() => {
        if (__SOLIDAUTH._session) {
          __SOLIDAUTH._getSession({ event: "poll" });
        }
      }, refetchInterval * 1000);
      onCleanup(() => clearInterval(refetchIntervalTimer));
    }
  });

  const value = createMemo(() => ({
    data: session(),
    status: loading()
      ? "loading"
      : session()
      ? "authenticated"
      : "unauthenticated",
  }));

  return (
    <SessionContext.Provider value={value as any}>
      {props.children}
    </SessionContext.Provider>
  );
}

export async function signIn<
  P extends RedirectableProviderType | undefined = undefined
>(
  providerId?: LiteralUnion<
    P extends RedirectableProviderType
      ? P | BuiltInProviderType
      : BuiltInProviderType
  >,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorizationParams
) {
  const { redirectTo = window.location.href, redirect = true } = options ?? {};

  const isCredentials = providerId === "credentials";
  const isEmail = providerId === "email";
  const isSupportingReturn = isCredentials || isEmail;

  const signInUrl = `/api/auth/${
    isCredentials ? "callback" : "signin"
  }/${providerId}`;

  const _signInUrl = `${signInUrl}?${new URLSearchParams(authorizationParams)}`;

  const csrfTokenResponse = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfTokenResponse.json();

  const res = await fetch(_signInUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    // @ts-expect-error -- ignore
    body: new URLSearchParams({
      ...options,
      csrfToken,
      callbackUrl: redirectTo,
    }),
  });

  const data = await res.json();
  if (redirect || !isSupportingReturn) {
    window.location.href = data.url ?? data.redirect ?? redirectTo;
    if (data.url.includes("#")) window.location.reload();
    return;
  }
  const error = new URL(data.url).searchParams.get("error");
  if (res.ok) {
    await __SOLIDAUTH._getSession({ event: "storage" });
  }
  return {
    error,
    status: res.status,
    ok: res.ok,
    url: error ? null : data.url,
  } as const;
}

export async function signOut(options?: SignOutParams) {
  const { redirectTo = window.location.href, redirect } = options ?? {};
  const csrfTokenResponse = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfTokenResponse.json();
  const res = await fetch(`/api/auth/signout`, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: redirectTo,
    }),
  });
  const data = await res.json();
  if (redirect) {
    const url = data.url ?? data.redirect ?? redirectTo;
    window.location.href = url;
    if (url.includes("#")) window.location.reload();
  }
  await __SOLIDAUTH._getSession({ event: "storage" });
  return data;
}

export async function getSession(): Promise<Session | null> {
  const res = await fetch(`/api/auth/session`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  if (!data) return null;
  if (Object.keys(data).length === 0) return null;
  return data;
}
