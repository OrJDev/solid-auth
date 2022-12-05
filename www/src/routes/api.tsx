import { DocsLayout } from "~/components";

export default function ApiLayout() {
  return (
    <DocsLayout
      items={[
        {
          heading: "Base",
          items: [
            "Authenticator",
            "createSolidAuthClient",
            "createSolidAuthHandler",
          ],
        },
        {
          heading: "Strategies",
          items: ["OAuth2", "Auth0", "Credentials"],
        },
        {
          heading: "Social Strategies",
          items: [
            "Google",
            "Discord",
            "GitHub",
            "Facebook",
            "Microsoft",
            "Strava",
          ],
        },
      ]}
    />
  );
}
