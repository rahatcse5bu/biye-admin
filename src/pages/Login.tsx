import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [useEmailLogin, setUseEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthStore();

  const handleGoogleSignIn = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      toast.error("Google login information not received");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.googleAuth({
        credential: credentialResponse.credential,
      });

      if (response.user.user_role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        return;
      }

      login(response.token, response.user);
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.response?.status === 401) {
        toast.error("Access denied. Admin privileges required.");
      } else {
        toast.error(
          error.response?.data?.message ||
            "Google login failed. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email,
        password,
      });

      if (response.user.user_role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        return;
      }

      login(response.token, response.user);
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid credentials or admin access denied.");
      } else {
        toast.error(
          error.response?.data?.message || "Login failed. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-green-950">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#132c36] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-base">PN</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-none">
              PNC Nikah
            </p>
            <p className="text-green-200 text-xs mt-0.5">Admin Portal</p>
          </div>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            A thoughtful space.
            <br />A connected community.
          </h1>
          <p className="text-green-200 text-base leading-relaxed max-w-sm">
            Full control over biodatas, users, payments, and refunds — all in
            one place.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <ShieldCheckIcon className="h-5 w-5 text-green-300" />
            <span className="text-green-300 text-sm">
              Restricted to admin accounts only
            </span>
          </div>
        </div>
        <p className="relative text-green-300/60 text-xs">
          © {new Date().getFullYear()} PNC Soft Tech. All rights reserved.
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PN</span>
            </div>
            <p className="text-gray-900 font-semibold">PNC Nikah Admin</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">
              {useEmailLogin
                ? "Use your admin credentials"
                : "Use your admin Google account"}{" "}
              to continue
            </p>
          </div>

          {!useEmailLogin ? (
            <>
              <div
                className="flex min-h-11 items-center justify-center overflow-hidden rounded-xl"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <div
                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
                    role="status"
                  >
                    <svg
                      className="w-4 h-4 animate-spin text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Signing in…</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSignIn}
                    onError={() =>
                      toast.error("Google login failed. Please try again.")
                    }
                    text="signin_with"
                    size="large"
                    width="280"
                    shape="rectangular"
                    theme="outline"
                  />
                )}
              </div>

              <p className="text-center text-xs text-gray-400">
                Only accounts with{" "}
                <span className="font-semibold text-gray-600">admin</span>{" "}
                privileges can access this panel.
              </p>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              <button
                onClick={() => setUseEmailLogin(true)}
                className="w-full px-5 py-3 border-2 border-green-200 rounded-xl text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
              >
                Sign in with email
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleDirectSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <span>Signing in…</span>
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
              <button
                onClick={() => setUseEmailLogin(false)}
                className="w-full px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
              >
                Back to Google sign-in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
