"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="mt-8 w-full rounded-full bg-red-600 py-4 font-black text-white"
    >
      Logout
    </button>
  );
}