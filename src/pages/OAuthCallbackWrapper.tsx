import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import OAuthCallback from "./OAuthCallback";
import Login from "./Login";

/**
 * Wrapper component to route OAuth callbacks to the correct handler
 * Checks if we're adding an email box or logging in
 */
const OAuthCallbackWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in the process of adding email
    const isAddingEmail = sessionStorage.getItem("adding_email") === "true";
    
    // If we're adding an email, use OAuthCallback component
    // Otherwise, use Login component (for login flow)
    if (isAddingEmail) {
      // The OAuthCallback component will handle this
      return;
    } else {
      // This is a login flow, redirect to Login component's callback handler
      // The Login component already handles /oauth2callback
      return;
    }
  }, [searchParams, navigate]);

  // Check if we're adding an email box
  const isAddingEmail = sessionStorage.getItem("adding_email") === "true";

  // If adding email, use OAuthCallback, otherwise use Login
  if (isAddingEmail) {
    return <OAuthCallback />;
  }

  return <Login />;
};

export default OAuthCallbackWrapper;

