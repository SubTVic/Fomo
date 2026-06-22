// SPDX-License-Identifier: AGPL-3.0-only

export function UnverifiedNotice() {
  return (
    <div className="border-2 border-navy bg-card p-4 text-sm text-body">
      <p className="mb-1 font-heading text-xs uppercase tracking-wider text-navy">
        Hinweis zu unbestätigten Gruppen
      </p>
      <p>
        Die Profile dieser Gruppen wurden von einer KI aus öffentlich verfügbaren
        Internetquellen zusammengetragen — kein:e Gruppenverantwortliche:r hat die Angaben
        offiziell bestätigt. Sie können unvollständig, veraltet oder fehlerhaft sein.
      </p>
    </div>
  );
}
