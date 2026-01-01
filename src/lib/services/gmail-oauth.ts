/**
 * Gmail OAuth Service
 * Handles Google OAuth 2.0 authentication flow for Gmail email accounts
 */

export interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GmailOAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export class GmailOAuthService {
  private config: GmailOAuthConfig;

  constructor(config: GmailOAuthConfig) {
    this.config = {
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
      ],
      ...config,
    };
  }

  /**
   * Validate that all required configuration is present
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error("Gmail OAuth client ID is not configured");
    }
    if (!this.config.clientSecret) {
      throw new Error("Gmail OAuth client secret is not configured");
    }
    if (!this.config.redirectUri) {
      throw new Error("Gmail OAuth redirect URI is not configured");
    }
  }

  /**
   * Generate the Google OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    this.validateConfig();

    const authParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes!.join(" "),
      response_type: "code",
      access_type: "offline", // This is crucial for getting refresh token
      prompt: "consent", // Force consent screen to ensure refresh token
      include_granted_scopes: "true",
    });

    if (state) {
      authParams.set("state", state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
  }

  /**
   * Initiate OAuth flow by redirecting to Google authorization page
   */
  initiateAuth(state?: string): void {
    const authUrl = this.getAuthorizationUrl(state);
    console.log("Redirecting to Google OAuth:", authUrl);
    window.location.href = authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GmailTokens> {
    this.validateConfig();

    const tokenPayload = {
      code: code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
    };

    console.log("Exchanging authorization code for tokens...");
    console.log("Token endpoint: https://oauth2.googleapis.com/token");
    console.log("Redirect URI:", this.config.redirectUri);
    console.log("Client ID:", this.config.clientId);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenPayload),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const error: GmailOAuthError = tokens;
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
      throw new Error("Access token not received from Google");
    }

    if (!tokens.id_token) {
      throw new Error("ID token not received from Google");
    }

    if (!tokens.refresh_token) {
      throw new Error(
        "Refresh token is required but not received from Google. Please revoke app permissions and try again."
      );
    }

    console.log("✅ Gmail OAuth Credentials Received:");
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
    console.log("ID Token:", tokens.id_token);
    console.log("Token Type:", tokens.token_type);
    console.log("Expires In:", tokens.expires_in);
    console.log("Scope:", tokens.scope);

    console.log("✅ All required tokens received successfully!");
    return tokens as GmailTokens;
  }
}

/**
 * Create Gmail OAuth service from environment variables
 */
export function createGmailOAuthService(): GmailOAuthService | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  const redirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/oauth2callback`;

  // Check if variables are missing or empty strings
  if (!clientId || clientId.trim() === '' || !clientSecret || clientSecret.trim() === '') {
    console.error("Gmail OAuth configuration is missing or invalid");
    console.error("Environment variables check:", {
      VITE_GOOGLE_CLIENT_ID: clientId ? "✓ Set" : "✗ Missing",
      VITE_GOOGLE_CLIENT_SECRET: clientSecret ? "✓ Set" : "✗ Missing",
      VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI || "Using default",
    });
    console.error("Note: Vite only exposes variables with VITE_ prefix.");
    return null;
  }

  return new GmailOAuthService({
    clientId,
    clientSecret,
    redirectUri,
  });
}


