import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { createOutlookOAuthService } from "../lib/services/outlook-oauth";
import { createGmailOAuthService } from "../lib/services/gmail-oauth";

interface AddEmailBoxDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddEmailBoxDialog: React.FC<AddEmailBoxDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOutlookConnect = () => {
    try {
      const oauthService = createOutlookOAuthService();

      if (!oauthService) {
        const errorMsg = 
          "Outlook OAuth is not configured.\n\n" +
          "Please check your environment variables:\n" +
          "- VITE_OUTLOOK_CLIENT_ID\n" +
          "- VITE_OUTLOOK_CLIENT_SECRET\n" +
          "- VITE_OUTLOOK_REDIRECT_URI (optional)\n" +
          "- VITE_OUTLOOK_TENANT_ID (optional)\n\n" +
          "Note: Vite requires VITE_ prefix (not NEXT_PUBLIC_).\n" +
          "After updating .env, restart your dev server.";
        alert(errorMsg);
        return;
      }

      setIsLoading("outlook");

      // Set flag BEFORE redirecting to indicate we're adding an email
      sessionStorage.setItem("adding_email", "true");
      sessionStorage.setItem("email_provider", "outlook");

      // Generate a unique state for CSRF protection
      const state = `email-outlook-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      localStorage.setItem("oauth_state", state);

      console.log("Initiating Outlook OAuth flow...");

      // Initiate Outlook OAuth flow - this will redirect to Microsoft
      oauthService.initiateAuth(state);

      // Note: Code below won't execute because page redirects to Microsoft
    } catch (err) {
      console.error("Error initiating Outlook OAuth:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to initiate Outlook authentication"
      );
      setIsLoading(null);
      sessionStorage.removeItem("adding_email");
      sessionStorage.removeItem("email_provider");
    }
  };

  const handleGmailConnect = () => {
    try {
      const oauthService = createGmailOAuthService();

      if (!oauthService) {
        const errorMsg = 
          "Gmail OAuth is not configured.\n\n" +
          "Please check your environment variables:\n" +
          "- VITE_GOOGLE_CLIENT_ID\n" +
          "- VITE_GOOGLE_CLIENT_SECRET\n" +
          "- VITE_GOOGLE_REDIRECT_URI (optional)\n\n" +
          "Note: Vite requires VITE_ prefix (not NEXT_PUBLIC_).\n" +
          "After updating .env, restart your dev server.";
        alert(errorMsg);
        return;
      }

      setIsLoading("gmail");

      // Set flag BEFORE redirecting to indicate we're adding an email
      sessionStorage.setItem("adding_email", "true");
      sessionStorage.setItem("email_provider", "gmail");

      // Generate a unique state for CSRF protection
      const state = `email-gmail-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      localStorage.setItem("oauth_state", state);

      console.log("Initiating Gmail OAuth flow...");

      // Initiate Gmail OAuth flow - this will redirect to Google
      oauthService.initiateAuth(state);

      // Note: Code below won't execute because page redirects to Google
    } catch (err) {
      console.error("Error initiating Gmail OAuth:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to initiate Gmail authentication"
      );
      setIsLoading(null);
      sessionStorage.removeItem("adding_email");
      sessionStorage.removeItem("email_provider");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] w-[calc(100%-2rem)] sm:w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect a shared email account</DialogTitle>
          <DialogDescription>
            Connecting a shared email account won't disrupt your existing tools
            — and you can disconnect it anytime. Once connected, Front AI will
            analyze your conversations to generate trends with Topics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Sign in with</h3>
            <div className="space-y-2">
              {/* Gmail Option */}
              <button
                onClick={handleGmailConnect}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {/* Gmail Icon */}
                  <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <span className="font-medium">Gmail Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>

              {/* Outlook Option */}
              <button
                onClick={handleOutlookConnect}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {/* Outlook Icon */}
                  <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <span className="font-medium">Office 365 User Mailbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            For other email types (ex: Google Group, Gmail Alias, Microsoft
            Distribution Group, and more) or other channel types (ex: Front
            Chat, social media, SMS, and more), go to channel settings.
          </p>

          {/* Information Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">
                  What email address should I use?
                </h4>
                <p className="text-sm text-purple-800">
                  Use a shared email address your team already uses to talk to
                  customers — not a personal one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

