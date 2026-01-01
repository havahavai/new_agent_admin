import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../api/auth";
import { createOutlookOAuthService } from "../lib/services/outlook-oauth";
import { createGmailOAuthService } from "../lib/services/gmail-oauth";
import { addEmailBox } from "../api/emailBoxes";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL first
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      // If no code and no error, this is not an OAuth callback
      if (!code && !error) {
        navigate("/email-boxes");
        return;
      }

      // Check if we've already processed this callback (prevent duplicate processing)
      const callbackProcessed = sessionStorage.getItem("oauth_callback_processed");
      if (callbackProcessed === "true") {
        console.log("OAuth callback already processed, redirecting...");
        sessionStorage.removeItem("oauth_callback_processed");
        navigate("/email-boxes");
        return;
      }

      // Mark as processing to prevent duplicate calls
      sessionStorage.setItem("oauth_callback_processed", "true");

      try {
        // First, check if user is authenticated - if not, redirect to login
        const authenticated = isAuthenticated();
        if (!authenticated) {
          console.log("User not authenticated, redirecting to login...");
          // Clear any OAuth state
          sessionStorage.removeItem("adding_email");
          sessionStorage.removeItem("email_provider");
          sessionStorage.removeItem("oauth_callback_processed");
          navigate("/login");
          return;
        }

        // Check if we're in the process of adding email
        const isAddingEmail = sessionStorage.getItem("adding_email") === "true";
        if (!isAddingEmail) {
          console.log("Not in email addition flow, redirecting...");
          sessionStorage.removeItem("oauth_callback_processed");
          navigate("/email-boxes");
          return;
        }

        // Get the provider from session storage
        const provider = sessionStorage.getItem("email_provider") || "outlook";

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        console.log(`Processing OAuth callback for ${provider} with code:`, code);

        let response;

        if (provider === "outlook") {
          // For Outlook, we just need to pass the code directly to the API
          // The backend will handle the token exchange
          console.log(`Calling addEmailBox API for ${provider}...`);
          response = await addEmailBox({
            provider: "outlook",
            code: code,
          });
        } else if (provider === "gmail") {
          // For Gmail, we need to exchange the code for tokens first
          const oauthService = createGmailOAuthService();
          if (!oauthService) {
            throw new Error("Gmail OAuth service is not configured");
          }

          console.log("Exchanging code for Gmail tokens...");
          const tokens = await oauthService.exchangeCodeForTokens(code);
          console.log("Gmail tokens received successfully");

          // Call the API with refreshToken and idToken
          console.log(`Calling addEmailBox API for ${provider}...`);
          response = await addEmailBox({
            provider: "gmail",
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          });
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }

        console.log("Email box added successfully:", response);

        setStatus("success");
        setMessage(
          response.data?.email
            ? `Email account ${response.data.email} added successfully!`
            : "Email account added successfully!"
        );

        // Update user data in localStorage if email is returned
        if (response.data?.email) {
          const userDataStr = localStorage.getItem("user");
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (!userData.emails) {
                userData.emails = [];
              }
              // Add new email if not already present
              const emailExists = userData.emails.some(
                (e: { email: string; provider: string }) =>
                  e.email === response.data?.email
              );
              if (!emailExists) {
                userData.emails.push({
                  email: response.data.email,
                  provider: provider,
                });
                localStorage.setItem("user", JSON.stringify(userData));
              }
            } catch (err) {
              console.error("Error updating user data:", err);
            }
          }
        }

        // Remove the flags
        sessionStorage.removeItem("adding_email");
        sessionStorage.removeItem("email_provider");
        sessionStorage.removeItem("oauth_callback_processed");

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/email-boxes");
        }, 2000);
      } catch (err) {
        console.error("Error in OAuth callback:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add email account";
        setStatus("error");
        setMessage(errorMessage);

        // Clear the flags on error
        sessionStorage.removeItem("adding_email");
        sessionStorage.removeItem("email_provider");
        sessionStorage.removeItem("oauth_callback_processed");

        // Redirect after error
        setTimeout(() => {
          navigate("/email-boxes");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing OAuth callback...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to email boxes...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to email boxes...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;


