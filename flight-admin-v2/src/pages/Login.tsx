import React, { useEffect, useState } from 'react';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // OAuth2 configuration from environment variables
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Define the scopes
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ];

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Validate environment variables
      if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !API_BASE_URL) {
        throw new Error('Missing required environment variables. Please check your .env file.');
      }

      // Create authorization URL manually for browser compatibility
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: scopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        include_granted_scopes: 'true',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
      console.log('Redirecting to Google OAuth:', authUrl);

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error during Google login:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate Google login');
      setIsLoading(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          setIsLoading(true);
          console.log('Authorization code received:', code);

          // Exchange authorization code for tokens using Google's token endpoint
          const tokenParams = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
          });

          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
          });

          const tokens = await tokenResponse.json();
          console.log('Tokens received from Google:', tokens);

          if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokens.error_description || tokens.error}`);
          }

          // Get user info
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
          );
          const userInfo = await userInfoResponse.json();
          console.log('User info from Google:', userInfo);

          // Prepare login API payload
          const loginPayload = {
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
            serverAuthCode: code,
          };

          console.log('Login payload for API:', loginPayload);

          // Hit the login API
          const loginResponse = await fetch(`${API_BASE_URL}/core/v2/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginPayload),
          });

          const loginResult = await loginResponse.json();
          console.log('Login API response:', loginResult);

          if (loginResponse.ok) {
            console.log('Login successful!');
            console.log('Complete OAuth flow data:', {
              googleTokens: tokens,
              userInfo: userInfo,
              loginApiResponse: loginResult
            });
            setSuccess(true);
            setError(null);
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('Login API failed:', loginResult);
            setError(`Login API failed: ${loginResult.message || 'Unknown error'}`);
          }

        } catch (err) {
          console.error('Error processing OAuth callback:', err);
          setError('Failed to process OAuth callback');
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [CLIENT_ID, CLIENT_SECRET, REDIRECT_URI]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your Google account to continue
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Login successful! Check the console for detailed OAuth flow data.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : success ? (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Login Successful
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </button>
          </div>

          {(error || success) && (
            <div className="text-center">
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(false);
                  setIsLoading(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-500 underline"
              >
                {success ? 'Test Again' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
