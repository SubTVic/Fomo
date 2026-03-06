// SPDX-License-Identifier: AGPL-3.0-only

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-6 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <p>
          Ein Projekt des{" "}
          <a
            href="https://www.stura.tu-dresden.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            StuRa TU Dresden
          </a>{" "}
          &middot; Open Source unter{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            AGPL-3.0
          </a>
        </p>
      </div>
    </footer>
  );
}
