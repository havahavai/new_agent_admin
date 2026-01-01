/**
 * Outlook OAuth Service
 * Handles Microsoft OAuth 2.0 authentication flow for Outlook email accounts
 */

export interface OutlookOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId?: string;
  scopes?: string[];
}

export interface OutlookTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface OutlookOAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export class OutlookOAuthService {
  private config: OutlookOAuthConfig;

  constructor(config: OutlookOAuthConfig) {
    this.config = {
      tenantId: "consumers",
      scopes: [
        "https://graph.microsoft.com/User.Read",
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/Mail.ReadWrite",
        "https://graph.microsoft.com/Mail.Send",
        "offline_access",
        "openid",
        "profile",
        "email",
      ],
      ...config,
    };
  }

  /**
   * Validate that all required configuration is present
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error("Outlook OAuth client ID is not configured");
    }
    if (!this.config.clientSecret) {
      throw new Error("Outlook OAuth client secret is not configured");
    }
    if (!this.config.redirectUri) {
      throw new Error("Outlook OAuth redirect URI is not configured");
    }
  }

  /**
   * Generate the Microsoft OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    this.validateConfig();

    const authParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes!.join(" "),
      response_type: "code",
      response_mode: "query",
      prompt: "consent", // Force consent screen to ensure refresh token
    });

    if (state) {
      authParams.set("state", state);
    }

    // Microsoft OAuth endpoint for consumers (Personal Microsoft accounts)
    const tenantId = this.config.tenantId || "consumers";
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${authParams.toString()}`;
  }

  /**
   * Initiate OAuth flow by redirecting to Microsoft authorization page
   */
  initiateAuth(state?: string): void {
    const authUrl = this.getAuthorizationUrl(state);
    console.log("Redirecting to Microsoft OAuth:", authUrl);
    window.location.href = authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OutlookTokens> {
    this.validateConfig();

    // Use consumers endpoint for Personal Microsoft accounts
    const tenantId = this.config.tenantId || "consumers";
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const tokenPayload = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
      scope: this.config.scopes!.join(" "),
    });

    console.log("Exchanging authorization code for tokens...");
    console.log("Token endpoint:", tokenEndpoint);
    console.log("Redirect URI:", this.config.redirectUri);
    console.log("Client ID:", this.config.clientId);

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenPayload.toString(),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const error: OutlookOAuthError = tokens;
      console.error("Token exchange error details:", error);
      console.error("Response status:", tokenResponse.status);
      throw new Error(
        `Token exchange failed: ${
          error.error_description || error.error || "Unknown error"
        }`
      );
    }

    // Validate required tokens
    if (!tokens.access_token) {
      throw new Error("Access token not received from Microsoft");
    }

    if (!tokens.id_token) {
      throw new Error("ID token not received from Microsoft");
    }

    if (!tokens.refresh_token) {
      throw new Error(
        "Refresh token is required but not received from Microsoft. Please revoke app permissions and try again."
      );
    }

    console.log("✅ Outlook OAuth Credentials Received:");
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
    console.log("ID Token:", tokens.id_token);
    console.log("Token Type:", tokens.token_type);
    console.log("Expires In:", tokens.expires_in);
    console.log("Scope:", tokens.scope);

    console.log("✅ All required tokens received successfully!");
    return tokens as OutlookTokens;
  }
}

/**
 * Create Outlook OAuth service from environment variables
 */
export function createOutlookOAuthService(): OutlookOAuthService | null {
  // Vite only exposes variables with VITE_ prefix
  // NEXT_PUBLIC_ variables are for Next.js and won't work in Vite
  const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_OUTLOOK_CLIENT_SECRET;
  const redirectUri =
    import.meta.env.VITE_OUTLOOK_REDIRECT_URI ||
    `${window.location.origin}/oauth/callback`;
  const tenantId = import.meta.env.VITE_OUTLOOK_TENANT_ID;

  // Check if variables are missing or empty strings
  if (!clientId || clientId.trim() === '' || !clientSecret || clientSecret.trim() === '') {
    console.error("Outlook OAuth configuration is missing or invalid");
    console.error("Environment variables check:", {
      VITE_OUTLOOK_CLIENT_ID: clientId ? "✓ Set" : "✗ Missing",
      VITE_OUTLOOK_CLIENT_SECRET: clientSecret ? "✓ Set" : "✗ Missing",
      VITE_OUTLOOK_REDIRECT_URI: import.meta.env.VITE_OUTLOOK_REDIRECT_URI || "Using default",
      VITE_OUTLOOK_TENANT_ID: tenantId || "Using default (consumers)",
    });
    console.error("Note: Vite only exposes variables with VITE_ prefix.");
    console.error("Please rename NEXT_PUBLIC_ variables to VITE_ in your .env file.");
    return null;
  }

  return new OutlookOAuthService({
    clientId,
    clientSecret,
    redirectUri,
    tenantId,
  });
}

