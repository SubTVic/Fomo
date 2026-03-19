// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border-4 border-foreground bg-card">
        <div className="bg-foreground text-primary-foreground px-6 py-4">
          <h1 className="font-heading text-xl uppercase">Admin-Login</h1>
        </div>
        <form
          action={async (formData: FormData) => {
            "use server";
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/admin",
              });
            } catch (err) {
              if (err instanceof AuthError) {
                redirect("/admin/login?error=credentials");
              }
              throw err;
            }
          }}
          className="flex flex-col gap-4 px-6 py-8"
        >
          {error === "credentials" && (
            <p className="border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
              E-Mail oder Passwort falsch.
            </p>
          )}
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
