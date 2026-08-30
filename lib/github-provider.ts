import GitHub from "next-auth/providers/github";

// GitHub's OAuth issuer is not Auth.js's fallback issuer.
// Keep issuer/state validation enabled; GitHub is OAuth, not OpenID Connect.
// https://docs.github.com/en/apps/github-authentication-discovery-endpoints
export const githubProvider = GitHub({
  clientId: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  issuer: "https://github.com/login/oauth",
});
