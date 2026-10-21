// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Notification pool for the FOKUS mini game (results-page ad).
 *
 * Tiers unlock the longer you survive, so long runs keep showing new
 * messages: 0 from the start, 1 after 15 s, 2 after 40 s, 3 ("legendary")
 * after 70 s and only now and then. Unseen messages are preferred.
 * Keep it light: student life in Dresden, nothing mean-spirited. Lines
 * marked "topical" refer to autumn 2026 and should be swapped later.
 */

export type Tier = 0 | 1 | 2 | 3;
type Text = { de: string; en: string };
export type Distraction = { from: Text; via: keyof typeof VIA; tier: Tier; text: Text };

/** App that delivers the message → icon letter and colour. */
export const VIA = {
  WhatsApp: "#25d366",
  Instagram: "#e1306c",
  TikTok: "#111111",
  YouTube: "#ff0000",
  Snapchat: "#f5c400",
  BeReal: "#333333",
  Tinder: "#fd5068",
  Spotify: "#1db954",
  Duolingo: "#58cc02",
  Mail: "#3b82f6",
  OPAL: "#00305d",
  Selma: "#6b4fbb",
  SLUB: "#c2185b",
  DVB: "#f5a300",
  Mensa: "#e65100",
  Bank: "#455a64",
  Dynamo: "#d4af00",
  FOKUS: "#182078",
} as const;

const t = (de: string, en: string): Text => ({ de, en });
const d = (tier: Tier, via: keyof typeof VIA, from: Text, text: Text): Distraction => ({ tier, via, from, text });

export const DISTRACTIONS: Distraction[] = [
  // tier 0 — everyday noise
  d(0, "TikTok", t("TikTok", "TikTok"), t("12 neue Videos für dich", "12 new videos for you")),
  d(0, "WhatsApp", t("Erstis 2026", "Freshers 2026"), t("47 neue Nachrichten", "47 new messages")),
  d(0, "Instagram", t("Instagram", "Instagram"), t("@lena hat eine Story gepostet", "@lena posted a story")),
  d(0, "WhatsApp", t("Mama", "Mum"), t("Hast du schon gegessen?", "Have you eaten yet?")),
  d(0, "WhatsApp", t("Crush 💘", "Crush 💘"), t("hast du morgen zeit?", "are you free tomorrow?")),
  d(0, "WhatsApp", t("Situationship", "Situationship"), t("was sind wir eigentlich?", "so what are we?")),
  d(0, "WhatsApp", t("Ex", "Ex"), t("hey… wie gehts dir so", "hey… how are you doing")),
  d(0, "WhatsApp", t("Gruppenprojekt", "Group project"), t("Wer macht eigentlich die Folien?", "So who's doing the slides?")),
  d(0, "WhatsApp", t("WG-Chat", "Flat chat"), t("WER hat meinen Joghurt gegessen", "WHO ate my yoghurt")),
  d(0, "BeReal", t("BeReal", "BeReal"), t("⚠️ Zeit für dein BeReal!", "⚠️ Time to BeReal!")),
  d(0, "YouTube", t("YouTube", "YouTube"), t("Neu: „10 Hacks fürs Studium“", "New: “10 study hacks”")),
  d(0, "Snapchat", t("Snapchat", "Snapchat"), t("3 neue Snaps", "3 new snaps")),
  d(0, "WhatsApp", t("Ex", "Ex"), t("ich vermiss dich 🥺", "i miss you 🥺")),
  d(0, "DVB", t("DVB", "DVB"), t("Linie 3: Verspätung ca. 12 Min.", "Tram 3: delayed approx. 12 min")),
  d(0, "YouTube", t("YouTube", "YouTube"), t("DorFuchs hat ein neues Video hochgeladen 🎵", "DorFuchs uploaded a new video 🎵")),

  // tier 1 — after 15 s
  d(1, "WhatsApp", t("Kommilitone", "Coursemate"), t("Kannst du mir deine Mitschrift schicken? 🙏", "Can you send me your notes? 🙏")),
  d(1, "WhatsApp", t("Gruppenprojekt", "Group project"), t("Kevin hat die Gruppe verlassen", "Kevin left the group")),
  d(1, "WhatsApp", t("WG-Chat", "Flat chat"), t("Der Putzplan ist KEIN Vorschlag!!!", "The cleaning rota is NOT a suggestion!!!")),
  d(1, "WhatsApp", t("Mitbewohni", "Flatmate"), t("Hab deinen Topf benutzt. Steht in der Spüle.", "Used your pot. It's in the sink.")),
  d(1, "WhatsApp", t("Crush 💘", "Crush 💘"), t("sorry, hab’s grad erst gesehen 🙈", "sorry, only just saw this 🙈")),
  d(1, "WhatsApp", t("Situationship", "Situationship"), t("bist du noch wach?", "you still up?")),
  d(1, "OPAL", t("OPAL", "OPAL"), t("Neue Abgabe: Übungsblatt 3 – heute 23:59", "New assignment: sheet 3 – due 23:59 today")),
  d(1, "DVB", t("DVB", "DVB"), t("Linie 61: Fahrt fällt aus", "Bus 61: trip cancelled")),
  d(1, "SLUB", t("SLUB", "SLUB library"), t("Deine Ausleihe ist überfällig", "Your loan is overdue")),
  d(1, "Mensa", t("Mensa", "Canteen"), t("Heute: Soljanka. Schon wieder.", "Today: Soljanka. Again.")),
  d(1, "Tinder", t("Tinder", "Tinder"), t("Neues Match! Es ist … dein Tutor.", "New match! It's … your tutor.")),
  d(1, "Spotify", t("Spotify", "Spotify"), t("Dein Rückblick: 14 h Lo-Fi zum „Lernen“", "Your recap: 14 h of lo-fi “to study”")),
  d(1, "WhatsApp", t("Papa", "Dad"), t("Hast du den Brief vom Amt gesehen?", "Did you see the letter from the council?")),
  d(1, "WhatsApp", t("Ex", "Ex"), t("weißt du noch, unser erstes Date an der Elbe?", "remember our first date by the Elbe?")),
  d(1, "WhatsApp", t("Neustadt-Crew", "Neustadt crew"), t("Elbwiesen, 18 Uhr, Sonnenuntergang? 🌅", "Elbe meadows, 6 pm, sunset? 🌅")),
  d(1, "Dynamo", t("Dynamo-Fanclub", "Dynamo fan club"), t("Pokal gegen Schalke, Mi 18 Uhr. Bist du dabei? ⚽", "Cup vs Schalke, Wed 6 pm. You in? ⚽")), // topical
  d(1, "Mensa", t("Mensa Zeltschlösschen", "Zeltschlösschen canteen"), t("Heute: Pizza-Tag. Schlange bis zur Tür.", "Today: pizza day. Queue to the door.")),
  d(1, "SLUB", t("SLUB", "SLUB library"), t("Alle Arbeitsplätze belegt. Viel Glück.", "All study desks taken. Good luck.")),
  d(1, "WhatsApp", t("Kommilitone", "Coursemate"), t("HSZ 03 ist voll, ich sitz auf der Treppe", "HSZ 03 is full, I'm sitting on the stairs")),

  // tier 2 — after 40 s
  d(2, "WhatsApp", t("Ex", "Ex"), t("hab noch deinen Hoodie. willst du den zurück?", "still have your hoodie. want it back?")),
  d(2, "WhatsApp", t("Situationship", "Situationship"), t("meine Mitbewohnerin fragt, ob wir zusammen sind lol", "my flatmate asked if we're together lol")),
  d(2, "WhatsApp", t("Crush 💘", "Crush 💘"), t("du bist doch auch in der Hochschulgruppe, oder? 👀", "you're in that student group too, right? 👀")),
  d(2, "WhatsApp", t("Gruppenprojekt", "Group project"), t("Ich hab die Datei aus Versehen gelöscht 😬", "I accidentally deleted the file 😬")),
  d(2, "WhatsApp", t("Kommilitone", "Coursemate"), t("Ist heute Anwesenheitspflicht???", "Is attendance mandatory today???")),
  d(2, "Mail", t("Prof. Krause", "Prof. Krause"), t("Folien sind hochgeladen (412 Seiten)", "Slides uploaded (412 pages)")),
  d(2, "WhatsApp", t("WG-Chat", "Flat chat"), t("Vermieter kommt in 10 Min. AUFRÄUMEN.", "Landlord coming in 10 min. CLEAN UP.")),
  d(2, "WhatsApp", t("Mitbewohni", "Flatmate"), t("Wer ist der Typ auf unserem Sofa?", "Who's the guy on our sofa?")),
  d(2, "Selma", t("Selma", "Selma"), t("Prüfungsanmeldung endet HEUTE", "Exam registration closes TODAY")),
  d(2, "Bank", t("Bank", "Bank"), t("Kontostand: 3,47 €", "Balance: €3.47")),
  d(2, "Duolingo", t("Duolingo 🦉", "Duolingo 🦉"), t("Die Eule ist enttäuscht.", "The owl is disappointed.")),
  d(2, "WhatsApp", t("Mama", "Mum"), t("Papa hat Facebook entdeckt.", "Dad discovered Facebook.")),
  d(2, "WhatsApp", t("WG-Chat", "Flat chat"), t("Hat jemand den Neuen schon mal gesehen?", "Has anyone actually seen the new flatmate?")),
  d(2, "WhatsApp", t("Ex", "Ex"), t("sorry, die war nicht für dich 😅", "sorry, that wasn't meant for you 😅")),
  d(2, "WhatsApp", t("Mitbewohni", "Flatmate"), t("Dein Fahrrad ist weg. Das Schloss ist noch da.", "Your bike is gone. The lock is still there.")),
  d(2, "DVB", t("DVB", "DVB"), t("Marathon am Sonntag: Dein Bus fährt nicht.", "Marathon on Sunday: your bus isn't running.")), // topical
  d(2, "Instagram", t("Dresden Monarchs", "Dresden Monarchs"), t("Deutscher Meister! 🏈 Party heute Abend?", "German champions! 🏈 Party tonight?")), // topical
  d(2, "WhatsApp", t("Oma aus Pirna", "Grandma from Pirna"), t("Nu, wie isses? Kommste Sonntag zum Kuchen?", "So, how are you? Coming for cake on Sunday?")),
  d(2, "WhatsApp", t("WG-Chat", "Flat chat"), t("Wer hat die Fettbemme im Kühlschrank vergessen?", "Who left the lard sandwich in the fridge?")),

  // tier 3 — legendary, after 70 s and rare
  d(3, "WhatsApp", t("Crush 💘", "Crush 💘"), t("lustig, dein Ex ist mein Cousin 😳", "funny, your ex is my cousin 😳")),
  d(3, "WhatsApp", t("Situationship", "Situationship"), t("wir sollten mal reden. nach deiner Klausur.", "we should talk. after your exam.")),
  d(3, "Mail", t("Prof. Krause", "Prof. Krause"), t("Klausur wird vorgezogen. Auf morgen.", "The exam has been moved. To tomorrow.")),
  d(3, "WhatsApp", t("WG-Chat", "Flat chat"), t("Der Toaster hat gebrannt. Alles gut. Fast.", "The toaster caught fire. All fine. Mostly.")),
  d(3, "WhatsApp", t("Gruppenprojekt", "Group project"), t("Wer ist Jonas? Er ist seit 3 Wochen in der Gruppe.", "Who is Jonas? He's been in the group for 3 weeks.")),
  d(3, "WhatsApp", t("Oma", "Grandma"), t("WIE MACHT MAN HIER KLEINE BUCHSTABEN", "HOW DO I DO SMALL LETTERS")),
  d(3, "Mail", t("BAföG-Amt", "Student finance"), t("Ihr Antrag ist … unvollständig.", "Your application is … incomplete.")),
  d(3, "WhatsApp", t("Ex", "Ex"), t("bin übrigens auch in deiner Hochschulgruppe 🙂", "btw I joined your student group too 🙂")),
  d(3, "WhatsApp", t("Ex", "Ex"), t("hab gehört, du bist jetzt im K-Block?? seit wann magst du Fußball", "heard you're in the Dynamo end now?? since when do you like football")),
  d(3, "Mail", t("Stadt Dresden", "City of Dresden"), t("Fernsehturm: Wiedereröffnung verschoben. Auf 2030.", "TV tower: reopening postponed. To 2030.")),
  d(3, "WhatsApp", t("Crush 💘", "Crush 💘"), t("Striezelmarkt nächste Woche? Glühwein geht auf mich", "Striezelmarkt next week? Mulled wine's on me")),
  d(3, "FOKUS", t("FOKUS", "FOKUS"), t("Psst. Mit mir wär das nicht passiert. 😌", "Psst. This wouldn't happen with me. 😌")),
];

/** Messages from your own student group: leave them, don't tap them. */
export const GROUP_MESSAGES: Text[] = [
  t("Treffen heute 19 Uhr 📍", "Meeting today 7 pm 📍"),
  t("Willkommen im Team! 👋", "Welcome to the team! 👋"),
  t("Wer kommt mit zur Ersti-Party?", "Who's coming to the freshers' party?"),
  t("Probe ist verschoben auf Donnerstag", "Rehearsal moved to Thursday"),
  t("Wir haben Pizza bestellt, kommst du? 🍕", "We ordered pizza, coming? 🍕"),
  t("Du wurdest zur Gruppe hinzugefügt", "You were added to the group"),
  t("Schön, dass du da warst! ✨", "So glad you came! ✨"),
  t("Samstag: Ausflug in die Sächsische Schweiz ⛰️", "Saturday: trip to Saxon Switzerland ⛰️"),
];

const UNLOCK_MS: Record<Tier, number> = { 0: 0, 1: 15_000, 2: 40_000, 3: 70_000 };
const WEIGHT: Record<Tier, number> = { 0: 55, 1: 28, 2: 13, 3: 4 };

/**
 * Pick the next distraction (index into DISTRACTIONS): a tier among the
 * unlocked ones by weight, then preferably one not seen this round.
 * `r1`, `r2` are random numbers in [0, 1).
 */
export function pickDistraction(elapsed: number, seen: readonly number[], r1: number, r2: number): number {
  const tiers = ([0, 1, 2, 3] as Tier[]).filter((tier) => elapsed >= UNLOCK_MS[tier]);
  const total = tiers.reduce<number>((sum, tier) => sum + WEIGHT[tier], 0);
  let roll = r1 * total;
  let tier = tiers[0];
  for (const candidate of tiers) {
    roll -= WEIGHT[candidate];
    if (roll < 0) {
      tier = candidate;
      break;
    }
  }
  const inTier = DISTRACTIONS.map((_, i) => i).filter((i) => DISTRACTIONS[i].tier === tier);
  const fresh = inTier.filter((i) => !seen.includes(i));
  const pool = fresh.length ? fresh : inTier;
  return pool[Math.floor(r2 * pool.length)];
}
