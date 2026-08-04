"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!phone) {
      setStatus("Please enter your phone number.");
      return;
    }

    setLoading(true);
    setStatus("Sending OTP...");

    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Failed to Continue.");
      return;
    }

    setStatus(
  data.devCode
    ? `OTP sent. Test code: ${data.devCode}`
    : "OTP sent. Please check your phone."
);
    setStep("otp");
  }

  async function verifyOtp() {
    if (!code) {
      setStatus("Please enter the OTP code.");
      return;
    }

    setLoading(true);
    setStatus("Verifying OTP...");

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, code, name }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Failed to verify OTP.");
      return;
    }

    setStatus("Login successful.");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <a href="/" className="font-bold text-emerald-400">
          ← Home
        </a>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-4xl font-black">
            Login or Create Account
          </h1>

          <p className="mt-3 text-white/60">
            New users can create an account with their name and phone number. Existing users can log in with the same details.
          </p>

          {step === "phone" && (
            <div className="mt-8 space-y-5">
              <div>
                <label className="font-bold">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Adewale Omoniyi"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="font-bold">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Example: +2348012345678"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full rounded-full bg-emerald-500 px-6 py-4 font-black text-black disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="mt-8 space-y-5">
              <div>
                <label className="font-bold">OTP Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full rounded-full bg-emerald-500 px-6 py-4 font-black text-black disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => setStep("phone")}
                className="w-full rounded-full border border-white/20 px-6 py-4 font-bold text-white"
              >
                Change Phone Number
              </button>
            </div>
          )}

          {status && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black p-4 text-sm text-white/70">
              {status}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}