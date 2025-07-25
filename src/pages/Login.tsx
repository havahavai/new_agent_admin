import React, { useEffect, useState } from "react";
import { loginWithGoogle, loginWithEmailPassword, storeJwtTokenWithValidation, isAuthenticated } from "../api/auth";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed loginMode state as we're showing both options together
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OAuth2 configuration from environment variables
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  // Define the scopes
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ];

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      // User is already logged in, redirect to main app
      window.location.href = "/trips";
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate environment variables
      if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        throw new Error(
          "Missing required environment variables. Please check your .env file."
        );
      }

      // Create authorization URL manually for browser compatibility
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: scopes.join(" "),
        response_type: "code",
        access_type: "offline", // This is crucial for getting refresh token
        prompt: "consent", // Force consent screen to ensure refresh token
        include_granted_scopes: "true",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
      console.log("Redirecting to Google OAuth:", authUrl);

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error("Error during Google login:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate Google login"
      );
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      // Call the special user authentication API
      const loginResponse = await loginWithEmailPassword({
        email,
        password,
        role: "agent", // Default role as specified in the API
      });

      console.log("Email login API response:", loginResponse);

      // Validate and store JWT token with user type validation
      try {
        storeJwtTokenWithValidation(loginResponse.jwtToken, loginResponse.userType);
        console.log("✅ JWT token stored successfully!");

        // Redirect to main application
        console.log("Login successful! Redirecting to main app...");
        window.location.href = "/trips";
      } catch (validationError) {
        // Handle user type validation error
        throw validationError;
      }

    } catch (err) {
      console.error("Error during email/password login:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          setIsLoading(true);
          console.log("Authorization code received:", code);

          // Exchange authorization code for tokens using Google's token endpoint with JSON format
          const tokenPayload = {
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
          };

          console.log("Token exchange payload:", tokenPayload);

          const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tokenPayload),
            }
          );

          const tokens = await tokenResponse.json();
          console.log("Tokens received from Google:", tokens);

          if (!tokenResponse.ok) {
            throw new Error(
              `Token exchange failed: ${
                tokens.error_description || tokens.error || "Unknown error"
              }`
            );
          }

          // Check if we got the mandatory tokens
          if (!tokens.access_token) {
            throw new Error("Access token not received from Google");
          }

          if (!tokens.id_token) {
            throw new Error("ID token not received from Google");
          }

          if (!tokens.refresh_token) {
            throw new Error("Refresh token is required but not received from Google. Please revoke app permissions and try again.");
          }

          console.log("✅ All required tokens received successfully!");

          // Call the login API with the tokens
          console.log("Calling login API...");
          const loginResponse = await loginWithGoogle({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          });

          console.log("Login API response:", loginResponse);

          // Validate and store JWT token with user type validation
          try {
            storeJwtTokenWithValidation(loginResponse.jwtToken, loginResponse.userType);
            console.log("✅ JWT token stored successfully!");

            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);

            // Redirect to main application
            console.log("Login successful! Redirecting to main app...");
            window.location.href = "/trips";
          } catch (validationError) {
            // Handle user type validation error
            throw validationError;
          }

        } catch (err) {
          console.error("Error during login process:", err);
          setError(err instanceof Error ? err.message : "Login failed");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [CLIENT_ID, CLIENT_SECRET, REDIRECT_URI]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full sm:w-96 md:w-80 lg:w-96">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flyo</h1>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-6 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </div>
              )}
            </button>

            {/* Try Again Button */}
            {error && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(false);
                    setEmail('');
                    setPassword('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500 underline font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Login;
