/* eslint-disable @typescript-eslint/no-explicit-any */
import { Auth } from "@auth/core";
import type { Provider } from "@auth/core/providers";
import type { AuthAction, AuthConfig, Session } from "@auth/core/types";
import { serialize } from "cookie";
import { Cookie, parseString, splitCookiesString } from "set-cookie-parser";

export interface SolidAuthConfig extends Omit<AuthConfig, "providers"> {
  prefix?: string;
  providers: Provider<any>[];
}

const actions: AuthAction[] = [
  "providers",
  "session",
  "csrf",
  "signin",
  "signout",
  "callback",
  "verify-request",
  "error",
];

// currently multiple cookies are not supported, so we keep the important cookies for now
// because it gets updated anyways
const getSetCookieCallback = (
  cook?: string | null,
  sess?: boolean
): Cookie | undefined => {
  if (!cook) return;
  const splitCookie = splitCookiesString(cook);
  const start = sess ? "__Secure-" : "";
  const knownCookies = [
    `${start}next-auth.session-token`,
    `${start}next-auth.pkce.code_verifier`,
    `${start}next-auth.state`,
  ];
  for (const cookName of knownCookies) {
    const temp = splitCookie.find((e) => e.startsWith(`${cookName}=`));
    if (temp) {
      return parseString(temp);
    }
  }
  return parseString(splitCookie?.[0] ?? ""); // just return the first cookie if no session token is found
};

function SolidAuthHandler(prefix: string, authOptions: SolidAuthConfig) {
  return async (event: any) => {
    const { request } = event;
    const url = new URL(request.url);
    const action = url.pathname
      .slice(prefix.length + 1)
      .split("/")[0] as AuthAction;
    if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) {
      return;
    }
    const response = await Auth(request, authOptions);
    if (["callback", "signin", "signout"].includes(action)) {
      const parsedCookie = getSetCookieCallback(
        response.clone().headers.get("Set-Cookie"),
        authOptions.useSecureCookies ?? url.protocol === "https:"
      );
      if (parsedCookie) {
        response.headers.set(
          "Set-Cookie",
          serialize(parsedCookie.name, parsedCookie.value, parsedCookie as any)
        );
      }
    }
    return response;
  };
}

export function SolidAuth(config: SolidAuthConfig) {
  const { prefix = "/api/auth", ...authOptions } = config;
  authOptions.secret ??= process.env.AUTH_SECRET;
  authOptions.trustHost ??= !!(
    process.env.AUTH_TRUST_HOST ??
    process.env.VERCEL ??
    process.env.NODE_ENV !== "production"
  );
  const handler = SolidAuthHandler(prefix, authOptions);
  return {
    async GET(event: any) {
      return await handler(event);
    },
    async POST(event: any) {
      return await handler(event);
    },
  };
}

export type GetSessionResult = Promise<Session | null>;

export async function getSession(
  req: Request,
  options: AuthConfig
): GetSessionResult {
  options.secret ??= process.env.AUTH_SECRET;
  options.trustHost ??= true;

  const url = new URL("/api/auth/session", req.url);
  const response = await Auth(
    new Request(url, { headers: req.headers }),
    options
  );

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data;
  throw new Error(data.message);
}
