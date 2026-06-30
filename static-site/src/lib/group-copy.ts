// SPDX-License-Identifier: AGPL-3.0-only
import type { Group } from "./types";
import { groupTranslations } from "./group-translations";

export function groupCategory(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.categoryName;
  return (
    {
      "Internationales": "International",
      "Kunst & Kultur": "Arts & culture",
      "Nachhaltigkeit": "Sustainability",
      "Politik & Gesellschaft": "Politics & society",
      "Sonstiges": "Other",
      "Soziales Engagement": "Social engagement",
      "Sport & Bewegung": "Sports & movement",
      "Technik & Wissenschaft": "Technology & science",
      "Wirtschaft & Karriere": "Business & career",
    }[group.categoryName] ?? group.categoryName
  );
}

export function groupShortText(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.shortDescription || "";
  if (groupTranslations[group.slug]) return firstParagraph(groupTranslations[group.slug]);
  return translateGroupDescription(group.shortDescription || group.longDescription || "", group);
}

export function groupLongText(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.longDescription || group.shortDescription || "";
  if (groupTranslations[group.slug]) return groupTranslations[group.slug];
  return translateGroupDescription(group.longDescription || group.shortDescription || "", group);
}

function firstParagraph(text: string) {
  return text.split(/\n\s*\n/)[0] ?? text;
}

function englishSummary(group: Group) {
  const category = groupCategory(group, "en").toLowerCase();
  const rhythm = group.eventFrequency ? ` It usually meets ${frequency(group.eventFrequency)}.` : "";
  const language = group.language ? ` The group language is ${languageLabel(group.language)}.` : "";
  return `${group.name} is a TU Dresden student group in ${category}.${rhythm}${language}`;
}

function englishLongSummary(group: Group) {
  const parts = [englishSummary(group)];
  if (group.memberCount) parts.push(`It has about ${group.memberCount} members.`);
  if (group.groupSize) parts.push(`Its size is ${sizeLabel(group.groupSize)}.`);
  if (group.motto) parts.push(`Motto: "${group.motto}"`);
  return parts.join("\n\n");
}

function translateGroupDescription(text: string, group: Group) {
  if (!text || text === "null") return englishLongSummary(group);

  let translated = text;
  translated = translateCommonDescriptions(translated);
  const replacements: Array<[RegExp, string]> = [
    [/Schüler:innen/g, "school students"],
    [/Student:innen/g, "students"],
    [/Studierende/g, "students"],
    [/Studierenden/g, "students"],
    [/studierende/g, "student"],
    [/studentische Initiative/g, "student initiative"],
    [/studentischen Initiative/g, "student initiative"],
    [/studentische Gruppe/g, "student group"],
    [/studentischen Gruppe/g, "student group"],
    [/Hochschulgruppe/g, "student group"],
    [/Hochschulgruppen/g, "student groups"],
    [/eingetragene studentische Hochschulgruppe/g, "registered student group"],
    [/eingetragene Hochschulgruppe/g, "registered student group"],
    [/an der TU Dresden/g, "at TU Dresden"],
    [/der TU Dresden/g, "of TU Dresden"],
    [/Technische Universität Dresden/g, "Technische Universität Dresden"],
    [/ehrenamtlich/g, "on a volunteer basis"],
    [/ehrenamtlicher/g, "volunteer"],
    [/ehrenamtlichen/g, "volunteer"],
    [/gemeinnützige Organisation/g, "non-profit organization"],
    [/weltweit tätige/g, "globally active"],
    [/von Studierenden geführte/g, "student-led"],
    [/interkulturelle/g, "intercultural"],
    [/interkultureller/g, "intercultural"],
    [/internationale/g, "international"],
    [/internationalen/g, "international"],
    [/deutschen/g, "German"],
    [/deutsche/g, "German"],
    [/Deutsch/g, "German"],
    [/Englisch/g, "English"],
    [/Veranstaltungen/g, "events"],
    [/Veranstaltungsort/g, "event venue"],
    [/Trainingsveranstaltungen/g, "training events"],
    [/Informationsveranstaltungen/g, "information events"],
    [/Workshops/g, "workshops"],
    [/Vorträge/g, "lectures"],
    [/Vortragsreihen/g, "lecture series"],
    [/Podiumsdiskussionen/g, "panel discussions"],
    [/Exkursionen/g, "excursions"],
    [/Austauschprojekte/g, "exchange projects"],
    [/Praktika/g, "internships"],
    [/Freiwilligenprojekte/g, "volunteering projects"],
    [/Registrierungsaktionen/g, "registration drives"],
    [/Stammzellspender/g, "stem cell donors"],
    [/Blutkrebspatienten/g, "blood cancer patients"],
    [/Menschenrechte/g, "human rights"],
    [/Frauenrechte/g, "women's rights"],
    [/gesellschaftspolitischen Themen/g, "social and political topics"],
    [/gesellschaftspolitische Fragen/g, "social and political questions"],
    [/Hochschulpolitik/g, "university politics"],
    [/Mitbestimmung/g, "participation"],
    [/Studienbedingungen/g, "study conditions"],
    [/Arbeitsbedingungen/g, "working conditions"],
    [/Arbeitnehmerrechten/g, "employee rights"],
    [/Versicherungen/g, "insurance"],
    [/Steuern/g, "taxes"],
    [/Bildungsweg/g, "educational path"],
    [/Studienwahl/g, "choice of degree program"],
    [/Finanzierungsmöglichkeiten/g, "funding options"],
    [/Stipendien/g, "scholarships"],
    [/Studienstart/g, "start of studies"],
    [/Berufseinstieg/g, "career entry"],
    [/Führungserfahrungen/g, "leadership experience"],
    [/persönliche und berufliche Entwicklung/g, "personal and professional development"],
    [/Vernetzung/g, "networking"],
    [/vernetzt/g, "connects"],
    [/verbindet/g, "connects"],
    [/unterstützt/g, "supports"],
    [/begleiten/g, "support"],
    [/begleitet/g, "supports"],
    [/fördert/g, "promotes"],
    [/organisiert/g, "organizes"],
    [/bietet/g, "offers"],
    [/betreibt/g, "runs"],
    [/entwickeln/g, "develop"],
    [/bauen/g, "build"],
    [/konstruiert/g, "designs"],
    [/teilnimmt/g, "participates"],
    [/Teilnahme/g, "participation"],
    [/aktiv/g, "active"],
    [/aktiv ist/g, "is active"],
    [/Bereich/g, "field"],
    [/Bereichen/g, "fields"],
    [/Freizeit/g, "leisure"],
    [/Kunst und Kultur/g, "arts and culture"],
    [/Kunst/g, "arts"],
    [/Kultur/g, "culture"],
    [/Musik/g, "music"],
    [/Sport/g, "sports"],
    [/Sprache/g, "language"],
    [/akademische/g, "academic"],
    [/akademischen/g, "academic"],
    [/wissenschaftliche/g, "scientific"],
    [/wissenschaftlichen/g, "scientific"],
    [/praktische Kenntnisse/g, "practical knowledge"],
    [/praktisch/g, "practically"],
    [/Nachhaltigkeit/g, "sustainability"],
    [/Naturschutz/g, "nature conservation"],
    [/Forstwissenschaft/g, "forest science"],
    [/Wald- und Forstwirtschaft/g, "forestry"],
    [/Genaue Aktivitäten und Ausrichtung konnten nicht verifiziert werden\./g, "Specific activities and orientation could not be verified."],
    [/nicht verifiziert/g, "not verified"],
    [/ohne Vorkenntnisse/g, "without prior knowledge"],
    [/zum Mitmachen/g, "to get involved"],
    [/lädt .* ein/g, "invites students to get involved"],
    [/Wir informieren über/g, "We provide information about"],
    [/Unser Ziel ist es/g, "Our goal is"],
    [/Bei uns können alle mitmachen/g, "Everyone can join us"],
    [/Willkommen sind alle/g, "Everyone is welcome"],
    [/Die Gruppe setzt sich/g, "The group is committed"],
    [/Die Gruppe/g, "The group"],
    [/Der Verein/g, "The association"],
    [/Der Club/g, "The club"],
    [/Das Team/g, "The team"],
    [/Die Mitglieder/g, "The members"],
    [/Der Standort/g, "The local chapter"],
    [/Das Lokalkomitee/g, "The local committee"],
    [/ ist eine /g, " is a "],
    [/ ist ein /g, " is a "],
    [/ ist das /g, " is the "],
    [/ ist die /g, " is the "],
    [/ sind /g, " are "],
    [/ seit /g, " since "],
    [/ mit /g, " with "],
    [/ durch /g, " through "],
    [/ für /g, " for "],
    [/ zum /g, " for "],
    [/ zur /g, " for "],
    [/ im /g, " in the "],
    [/ in der /g, " in the "],
    [/ am /g, " at the "],
    [/ an /g, " at "],
    [/ und /g, " and "],
    [/ oder /g, " or "],
    [/ sowie /g, " as well as "],
    [/u\.a\./g, "including"],
    [/z\.B\./g, "e.g."],
    [/bzw\./g, "or rather"],
    [/ca\./g, "approx."],
    [/Gruppe/g, "group"],
    [/Verein/g, "association"],
    [/Mitglieder/g, "members"],
    [/Campus/g, "campus"],
    [/Gemeinschaft/g, "community"],
    [/Community/g, "community"],
    [/Projekte/g, "projects"],
    [/Projekt/g, "project"],
    [/Themen/g, "topics"],
    [/Fragen/g, "questions"],
    [/Ziel/g, "goal"],
    [/Zusammenarbeit/g, "cooperation"],
    [/Ausrichtung/g, "orientation"],
    [/Kontakte/g, "contacts"],
    [/Kontakteknüpfen/g, "making contacts"],
    [/Studium/g, "studies"],
    [/Studis/g, "students"],
    [/Menschen/g, "people"],
    [/junge/g, "young"],
    [/jungen/g, "young"],
    [/neue/g, "new"],
    [/neuen/g, "new"],
    [/regelmäßig/g, "regularly"],
    [/wöchentlichen/g, "weekly"],
    [/gemeinsam/g, "together"],
    [/miteinander/g, "with each other"],
    [/kostenlos/g, "free of charge"],
    [/offen/g, "open"],
  ];

  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }

  return tidyTranslation(translated);
}

function translateCommonDescriptions(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/ArbeiterKind\.de ist eine gemeinnützige Organisation, die Schüler:innen und Studierende aus nichtakademischen Familien auf ihrem Bildungsweg unterstützt\./g, "ArbeiterKind.de is a non-profit organization that supports school students and university students from non-academic families along their educational path."],
    [/Wir informieren über die Studienwahl, Finanzierungsmöglichkeiten wie BAföG und Stipendien,\nsowie alle wichtigen Fragen rund um das Studium\./g, "We provide information about choosing a degree program, funding options such as BAföG and scholarships, and all important questions related to studying."],
    [/Unser Ziel ist es, junge Menschen zum Studium zu ermutigen und eigene Erfahrungen vom Studienstart bis zum Berufseinstieg weiterzugeben\./g, "Our goal is to encourage young people to study and to share personal experiences from starting university to entering professional life."],
    [/Alle Menschen sollen frei über ihren Bildungsweg entscheiden können, unabhängig vom Bildungsstand der Eltern und unabhängig davon, woher sie kommen\./g, "Everyone should be able to choose their educational path freely, regardless of their parents' educational background or where they come from."],
    [/Die Hochschulgruppe ArbeiterKind\.de Dresden engagiert sich seit Jahren aktiv an der Technische Universität Dresden\./g, "The ArbeiterKind.de Dresden student group has been actively involved at Technische Universität Dresden for years."],
    [/Durch zahlreiche Informationsveranstaltungen unterstützen wir Studieninteressierte und Studierende dabei, den Einstieg ins Studium und den weiteren Studienverlauf erfolgreich zu meistern\./g, "Through numerous information events, we support prospective and current students in starting university and successfully navigating their studies."],
    [/Du willst dich ehrenamtlich engagieren\? Dann werde Teil unserer vielfältigen Community!/g, "Would you like to volunteer? Then become part of our diverse community!"],
    [/Die 404 University Esports Dresden ist die eingetragene Hochschulgruppe des 404 Multigaming e\.V\. an der TU Dresden, die seit 2019 Studierende durch gemeinsames Gaming und die Teilnahme an der Uniliga \(z\.B\. League of Legends, Rocket League\) miteinander verbindet\./g, "404 University Esports Dresden is the registered student group of 404 Multigaming e.V. at TU Dresden. Since 2019, it has connected students through playing together and taking part in the University Esports League (e.g. League of Legends, Rocket League)."],
    [/Sie organisiert LAN-Turniere, Online-Wettbewerbe und Community-Events auf dem Campus\./g, "It organizes LAN tournaments, online competitions and community events on campus."],
    [/AEGEE-Dresden ist das Dresdner Local des europaweiten European Students' Forum und fördert interkulturelle Vernetzung zwischen deutschen und internationalen Studierenden, u\.a\. durch das Buddy-Programm, Tandem-Partnerschaften, Auslandsaustausche und Trainingsveranstaltungen\./g, "AEGEE-Dresden is the Dresden local chapter of the Europe-wide European Students' Forum. It promotes intercultural networking between German and international students, including through the buddy program, tandem partnerships, international exchanges and training events."],
    [/AIAS Dresden e\.V\. ist eine studentische Initiative an der TU Dresden, die seit 2015 in Zusammenarbeit mit der DKMS Registrierungsaktionen für potenzielle Stammzellspender durchführt, um Blutkrebspatienten zu helfen\./g, "AIAS Dresden e.V. is a student initiative at TU Dresden that has organized registration drives for potential stem cell donors in cooperation with DKMS since 2015 in order to help blood cancer patients."],
    [/Die Gruppe setzt sich ehrenamtlich dafür ein, möglichst viele Studierende als Stammzellspender zu gewinnen und hat bisher über 7\.300 Registrierungen erzielt\./g, "The group works on a volunteer basis to recruit as many students as possible as stem cell donors and has already achieved more than 7,300 registrations."],
    [/AIESEC ist eine weltweit tätige, von Studierenden geführte Organisation, die interkulturelle Austauschprojekte, Praktika und Freiwilligenprojekte im Ausland vermittelt\./g, "AIESEC is a globally active, student-led organization that arranges intercultural exchange projects, internships and volunteering projects abroad."],
    [/Das Lokalkomitee Dresden an der TU Dresden fördert die persönliche und berufliche Entwicklung junger Menschen durch Führungserfahrungen im internationalen Umfeld\./g, "The Dresden local committee at TU Dresden supports young people's personal and professional development through leadership experience in an international environment."],
    [/Die ANW Hochschulgruppe Tharandt ist eine studentische Gruppe an der TU Dresden \(Standort Tharandt\) mit Bezug zur Forstwissenschaft und Naturschutz, vermutlich im Bereich Angewandte Naturwissenschaften oder Wald- und Forstwirtschaft aktiv\./g, "The ANW student group in Tharandt is a student group at TU Dresden's Tharandt campus with links to forest science and nature conservation, presumably active in applied natural sciences or forestry."],
    [/Die Akaflieg Dresden ist eine studentische Hochschulgruppe, die sich mit dem Bau und der Entwicklung von Segelflugzeugen sowie dem Segelfliegen beschäftigt\./g, "Akaflieg Dresden is a student group focused on building and developing gliders as well as gliding itself."],
    [/Studierende entwickeln und bauen eigenständig Flugzeuge und erwerben dabei praktische Kenntnisse in Luft- und Raumfahrttechnik\./g, "Students independently develop and build aircraft while gaining practical knowledge in aerospace engineering."],
    [/Campusradio Dresden e\.V\. ist ein studentisches, hochschulübergreifendes Internetradio, das von Studierenden für Studierende produziert wird\./g, "Campusradio Dresden e.V. is a student-run internet radio station across universities, produced by students for students."],
    [/Die Mitglieder erstellen Podcasts, Sendungen und Beiträge zu Themen aus Campus, Kultur, Musik und Gesellschaft – ohne Vorkenntnisse im Radiobereich\./g, "Members create podcasts, shows and contributions on campus life, culture, music and society, with no prior radio experience required."],
    [/Christians for Mission ist eine christliche Hochschulgruppe an der TU Dresden, die Studierende unterschiedlicher Hintergründe zusammenbringt, um gemeinsam über den christlichen Glauben zu diskutieren, die Bibel zu lesen und Gemeinschaft zu erleben\./g, "Christians for Mission is a Christian student group at TU Dresden that brings together students from different backgrounds to discuss the Christian faith, read the Bible and experience community."],
    [/Club 11 e\.V\. ist ein ehrenamtlicher Studentenclub an der TU Dresden \(Hochschulstraße 48\), der eine Bar betreibt und regelmäßig Veranstaltungen wie Partys, Bandabende, Quiz-Abende und den traditionellen Bockbieranstich organisiert\./g, "Club 11 e.V. is a volunteer student club at TU Dresden (Hochschulstraße 48) that runs a bar and regularly organizes events such as parties, band nights, quiz nights and the traditional Bockbier tapping."],
    [/Der Verein wird von Studierenden für Studierende geführt und lädt zum Mitmachen, Bardienst und Veranstaltungsplanung ein\./g, "The association is run by students for students and invites people to get involved, work bar shifts and help plan events."],
    [/DE-LATAM e\.V\. ist eine lateinamerikanische Hochschulgruppe an der TU Dresden, die Studierende aus Lateinamerika und Interessierte vernetzt und in den Bereichen Sprache, Sport, Freizeit, interkultureller Austausch, Kunst und Kultur sowie akademische Veranstaltungen aktiv ist\./g, "DE-LATAM e.V. is a Latin American student group at TU Dresden that connects students from Latin America with interested students and is active in language, sports, leisure, intercultural exchange, arts and culture as well as academic events."],
    [/Die DGB Hochschulgruppe Dresden ist die gewerkschaftliche Hochschulgruppe an TU und HTW Dresden, die sich in Hochschulpolitik, Mitbestimmung sowie Studien- und Arbeitsbedingungen einmischt\./g, "The DGB student group Dresden is the trade-union student group at TU Dresden and HTW Dresden that gets involved in university politics, participation, study conditions and working conditions."],
    [/Sie bietet regelmäßige Beratungen zu Arbeitnehmerrechten, Versicherungen und Steuern für Studierende an\./g, "It offers regular advising for students on employee rights, insurance and taxes."],
    [/Die Hängemathe ist ein gemütliches Wohnzimmer, in dem man Leute treffen und Spaßgetränke schlürfen kann\./g, "HängeMathe is a cozy living-room-like club where you can meet people and enjoy fun drinks."],
    [/Der Club wurde 1990 von Mathestudis gegründet und dann irgendwann halb von der Physik übernommen, aber wir haben auch Leute aus anderen Studiengängen und es wird nicht die ganze Zeit nur über Mathe geredet\./g, "The club was founded in 1990 by mathematics students and was later partly taken over by physics, but people from other degree programs are also involved and not everything is about mathematics all the time."],
    [/Viele Clubmitglieder spielen gerne Kartenspiele, Brettspiele, Trinkspiele oder auch Tischkicker\./g, "Many club members enjoy card games, board games, drinking games and table football."],
    [/Wir öffnen drei Mal in der Woche den Club, wobei sehr häufig auch neben dem Bardienst noch Clubmitglieder als Gäste da sind, um einen entspannten Abend zu verbringen\./g, "We open the club three times a week, and club members often come by as guests as well as for bar shifts to spend a relaxed evening."],
    [/Willkommen sind alle, die vorbeikommen wollen, mit der Ausnahme, dass Diskriminierung nicht ok ist und Nazis Hausverbot haben\./g, "Everyone who wants to drop by is welcome, with the clear exception that discrimination is not okay and Nazis are barred from the venue."],
  ];

  let translated = text;
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

function tidyTranslation(text: string) {
  return text
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\bDie\b/g, "The")
    .replace(/\bDer\b/g, "The")
    .replace(/\bDas\b/g, "The")
    .replace(/\bden\b/g, "the")
    .replace(/\bder\b/g, "the")
    .replace(/\bdie\b/g, "the")
    .replace(/\bdas\b/g, "the")
    .replace(/\bein\b/g, "a")
    .replace(/\beine\b/g, "a")
    .replace(/\beinen\b/g, "a")
    .replace(/\beinem\b/g, "a")
    .replace(/\bdes\b/g, "of the")
    .replace(/\bvon\b/g, "of")
    .replace(/\bzu\b/g, "to")
    .replace(/\bauf\b/g, "on")
    .replace(/\bals\b/g, "as")
    .replace(/\bdabei\b/g, "in the process")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function frequency(value: string) {
  return { high: "weekly", medium: "monthly", low: "occasionally" }[value] ?? value;
}

function languageLabel(value: string) {
  return { german: "German", english: "English", both: "German and English" }[value] ?? value;
}

function sizeLabel(value: string) {
  return { small: "small", medium: "medium", large: "large" }[value] ?? value;
}
