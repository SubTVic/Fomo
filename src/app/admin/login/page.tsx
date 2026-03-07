// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-4">
          <h1 className="font-heading text-xl uppercase">Admin-Login</h1>
        </div>
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/admin",
            });
          }}
          className="flex flex-col gap-4 px-6 py-8"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border-2 border-foreground/30 bg-card px-3 py-2 text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">Passwort</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border-2 border-foreground/30 bg-card px-3 py-2 text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>
          <button
            type="submit"
            className="mt-2 bg-foreground py-2.5 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
