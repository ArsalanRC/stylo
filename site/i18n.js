/**
 * Every string on the page, in both languages.
 *
 * The sample texts are written for this page rather than taken from the corpus.
 * The corpus texts are published papers and dissertations, so quoting them here
 * would republish them, which is the same reason the library ships the measured
 * distribution and not the sources it was measured from.
 *
 * Each sample is over 300 words on purpose. Below that the library attaches a
 * warning, and a demo whose own examples trip its own warning teaches the wrong
 * lesson on the first click.
 */

const SAMPLE_EVEN_EN = `The warehouse management system records a movement whenever stock changes hands. Each movement carries a source location, a target location, a quantity and the identity of whoever triggered it. Nothing else is stored at that level, because a movement that carries interpretation alongside fact becomes impossible to correct later without deciding which of the two was wrong.

Counts are a separate concern. A count is an assertion that a location held a particular quantity at a particular moment, and it does not describe a change. Treating the two as one table looked attractive early on, since both mention a location and a quantity. It stopped looking attractive the first time a count disagreed with the running total and there was no way to express that disagreement except by inventing a movement nobody had made.

The reconciliation runs nightly and compares the running total against the most recent count for every location that has one. Three outcomes are possible. They agree, in which case nothing is recorded. They disagree by less than the tolerance configured for that article group, which is written to a log and otherwise ignored. Or they disagree by more, and a task is raised for a human to walk to the shelf and look.

That third path is the only one that matters, and it is the one that took longest to get right. An early version raised a task for every discrepancy, which produced four hundred tasks on the first night and taught everybody to close them without reading. Tolerances came out of that failure rather than out of the design. The number of tasks a system produces is part of its interface, and a system that produces more than anyone can act on has the same effect as one that produces none at all, while looking considerably more diligent.

Tolerances are configured per article group rather than globally. Screws move in thousands and nobody counts them exactly; a pallet of monitors does not have a tolerance at all, and a discrepancy of one there is worth a walk to the shelf. One global number would have to be wrong for one of those two cases, and whichever way it was set, the group it was wrong for would be the group that stopped trusting the system.`;

const SAMPLE_UNIFORM_EN = `The system processes each incoming record according to the configuration. Moreover, it validates every field against the schema before writing. Furthermore, it maintains an audit log of all operations performed. Additionally, the implementation ensures that failures are handled appropriately.

The architecture consists of three distinct layers. The presentation layer manages the interaction with the user. The application layer coordinates the execution of the business logic. The persistence layer handles the storage and retrieval of information. Consequently, the separation of concerns is maintained throughout the implementation.

The validation of the input is performed at the boundary. Thus, invalid data is rejected before it reaches the core. Hence, the internal components can assume the correctness of their inputs. Therefore, the complexity of the implementation is reduced significantly.

The configuration is loaded during the initialisation of the application. Notably, the configuration is validated at that point. Importantly, an invalid configuration prevents the application from starting. In addition, the operator receives a detailed description of the problem encountered.

The monitoring of the system is implemented through the collection of metrics. The metrics are exposed through a dedicated endpoint. The endpoint is consumed by the monitoring infrastructure. As a result, the operational visibility of the system is ensured.

The deployment of the application follows the established procedure. The artefact is built by the continuous integration pipeline. The artefact is then promoted through the environments in sequence. Overall, the reliability of the deployment process is considerably improved.

The testing of the implementation is performed at several levels. The unit tests verify the behaviour of the individual components. The integration tests verify the interaction between the components. The acceptance tests verify the satisfaction of the stated requirements. Consequently, the confidence in the correctness of the system is established.

In conclusion, the design of the system reflects the requirements identified during the analysis. The implementation adheres to the principles established at the outset. The documentation describes the behaviour of each component in detail. To sum up, the maintenance of the system is expected to remain manageable over time.`;

const SAMPLE_EVEN_DE = `Das Lagerverwaltungssystem schreibt eine Bewegung, sobald Bestand den Besitzer wechselt. Jede Bewegung trägt eine Quelle, ein Ziel, eine Menge und die Kennung dessen, der sie ausgelöst hat. Mehr steht auf dieser Ebene nicht, denn eine Bewegung, die neben dem Fakt schon die Deutung mitführt, lässt sich später nicht mehr korrigieren, ohne vorher zu entscheiden, welches von beidem falsch war.

Zählungen sind etwas anderes. Eine Zählung behauptet, dass ein Lagerplatz zu einem bestimmten Zeitpunkt eine bestimmte Menge enthielt, und sie beschreibt keine Veränderung. Beides in eine Tabelle zu legen wirkte am Anfang verlockend, schließlich nennen beide einen Platz und eine Menge. Verlockend war es genau bis zu dem Tag, an dem eine Zählung dem laufenden Bestand widersprach und es keine Möglichkeit gab, diesen Widerspruch auszudrücken, außer eine Bewegung zu erfinden, die niemand gemacht hatte.

Der Abgleich läuft nachts und stellt den laufenden Bestand der jüngsten Zählung gegenüber, für jeden Platz, zu dem es eine gibt. Drei Ausgänge sind möglich. Sie stimmen überein, dann wird nichts festgehalten. Sie weichen um weniger ab als die Toleranz der jeweiligen Artikelgruppe, dann geht das ins Protokoll und sonst nirgendwohin. Oder sie weichen um mehr ab, und es entsteht eine Aufgabe für einen Menschen, der zum Regal geht und nachsieht.

Nur der dritte Weg zählt, und er hat am längsten gebraucht. Eine frühe Fassung erzeugte zu jeder Abweichung eine Aufgabe, das waren in der ersten Nacht vierhundert, und alle lernten, sie ungelesen zu schließen. Die Toleranzen stammen aus diesem Fehlschlag und nicht aus dem Entwurf. Wie viele Aufgaben ein System erzeugt, gehört zu seiner Schnittstelle, und ein System, das mehr erzeugt, als jemand abarbeiten kann, wirkt genauso wie eines, das gar keine erzeugt, sieht dabei allerdings deutlich fleißiger aus.

Die Toleranzen hängen an der Artikelgruppe und nicht an einer globalen Zahl. Schrauben bewegen sich in Tausenderschritten, und niemand zählt sie genau nach; eine Palette Monitore hat gar keine Toleranz, dort lohnt sich der Gang zum Regal schon bei einem Stück Abweichung. Eine einzige globale Zahl müsste für einen der beiden Fälle falsch sein, und die Gruppe, für die sie falsch gesetzt wäre, wäre genau die Gruppe, die dem System als Erstes nicht mehr glaubt.`;

const SAMPLE_UNIFORM_DE = `Das System verarbeitet jeden eingehenden Datensatz gemäß der Konfiguration. Zudem validiert es jedes Feld gegen das Schema vor der Speicherung. Darüber hinaus führt es ein Protokoll sämtlicher durchgeführter Operationen. Ferner stellt die Implementierung sicher, dass Fehlerfälle angemessen behandelt werden.

Die Architektur besteht aus drei getrennten Schichten. Die Präsentationsschicht verantwortet die Interaktion mit dem Anwender. Die Anwendungsschicht koordiniert die Ausführung der fachlichen Logik. Die Persistenzschicht übernimmt die Speicherung und die Wiederbeschaffung der Informationen. Folglich bleibt die Trennung der Zuständigkeiten durchgängig erhalten.

Die Validierung der Eingaben erfolgt an der Systemgrenze. Somit werden ungültige Daten abgewiesen, bevor sie den Kern erreichen. Hierdurch können die inneren Komponenten die Korrektheit ihrer Eingaben voraussetzen. Insbesondere reduziert sich dadurch die Komplexität der Implementierung erheblich.

Die Konfiguration wird während der Initialisierung der Anwendung geladen. Grundsätzlich wird die Konfiguration zu diesem Zeitpunkt validiert. Hierbei verhindert eine ungültige Konfiguration den Start der Anwendung. Diesbezüglich erhält der Betreiber eine ausführliche Beschreibung des aufgetretenen Problems.

Die Überwachung des Systems wird durch die Erhebung von Kennzahlen umgesetzt. Die Kennzahlen werden über einen eigenen Endpunkt bereitgestellt. Der Endpunkt wird von der Überwachungsinfrastruktur ausgewertet. Dementsprechend ist die betriebliche Sichtbarkeit des Systems sichergestellt.

Die Auslieferung der Anwendung folgt dem etablierten Verfahren. Das Artefakt wird von der Integrationsstrecke erzeugt. Das Artefakt wird anschließend durch die Umgebungen befördert. Letztlich verbessert sich die Verlässlichkeit des Auslieferungsprozesses erheblich.

Die Prüfung der Umsetzung erfolgt auf mehreren Ebenen. Die Modultests prüfen das Verhalten der einzelnen Komponenten. Die Integrationstests prüfen das Zusammenspiel der Komponenten. Die Abnahmetests prüfen die Erfüllung der erhobenen Anforderungen. Demgegenüber bleibt die Prüfung der nichtfunktionalen Anforderungen gesondert zu betrachten. Folglich ist das Vertrauen in die Korrektheit des Systems hergestellt.

Vor diesem Hintergrund spiegelt der Entwurf des Systems die in der Analyse erhobenen Anforderungen. Die Umsetzung folgt den eingangs festgelegten Grundsätzen. Die Dokumentation beschreibt das Verhalten jeder Komponente im Einzelnen. Im Wesentlichen ist damit zu rechnen, dass die Wartung des Systems handhabbar bleibt.`;

export const SAMPLES = {
  en: { even: SAMPLE_EVEN_EN, uniform: SAMPLE_UNIFORM_EN },
  de: { even: SAMPLE_EVEN_DE, uniform: SAMPLE_UNIFORM_DE },
};

/**
 * Feature labels, keyed by the library's feature keys.
 *
 * The library ships English labels only, and deliberately: a library that
 * returns localised strings makes every caller live with its choice of wording
 * and its choice of languages. The stable thing to expose is the key, and the
 * page owns how it reads. English is repeated here rather than falling through
 * to the library so both languages sit side by side and neither drifts.
 */
export const FEATURE_LABELS = {
  en: {
    sent_len_mean: "mean sentence length (words)",
    sent_len_std: "sentence-length spread",
    sent_len_cv: "sentence-length variation",
    short_sent_ratio: "sentences of 7 words or fewer",
    long_sent_ratio: "sentences of 28 words or more",
    mattr: "lexical diversity (MATTR-50)",
    comma_per_sent: "commas per sentence",
    connector_density: "formal connectives per 100 words",
    hedge_density: "hedges per 100 words",
    passive_density: "passive constructions per 100 words",
    nominalization_density: "nominalisations per 100 words",
    subordination_density: "subordinators per 100 words",
    mean_word_len: "mean word length (characters)",
    long_word_ratio: "words of 14 characters or more",
    punct_variety: "punctuation range used",
    em_dash_density: "dashes per 100 words",
    para_len_cv: "paragraph-length variation",
    rhetorical_pair_rate: "balanced pairs per 1000 words",
    sent_start_repetition: "repeated sentence openings",
  },
  de: {
    sent_len_mean: "mittlere Satzlänge (Wörter)",
    sent_len_std: "Streuung der Satzlänge",
    sent_len_cv: "Variation der Satzlänge",
    short_sent_ratio: "Sätze mit höchstens 7 Wörtern",
    long_sent_ratio: "Sätze mit mindestens 28 Wörtern",
    mattr: "lexikalische Vielfalt (MATTR-50)",
    comma_per_sent: "Kommata pro Satz",
    connector_density: "formale Konnektoren je 100 Wörter",
    hedge_density: "Modalpartikeln je 100 Wörter",
    passive_density: "Passivkonstruktionen je 100 Wörter",
    nominalization_density: "Nominalisierungen je 100 Wörter",
    subordination_density: "Subjunktionen je 100 Wörter",
    mean_word_len: "mittlere Wortlänge (Zeichen)",
    long_word_ratio: "Wörter mit mindestens 14 Zeichen",
    punct_variety: "Bandbreite der Satzzeichen",
    em_dash_density: "Gedankenstriche je 100 Wörter",
    para_len_cv: "Variation der Absatzlänge",
    rhetorical_pair_rate: "ausbalancierte Paare je 1000 Wörter",
    sent_start_repetition: "wiederholte Satzanfänge",
  },
};

/**
 * Warning text, rendered from the library's structured warning codes.
 *
 * The library also carries an English `message` on every warning, but showing
 * that to a German reader is exactly the bug this replaced.
 */
export const WARNINGS = {
  en: {
    "short-text": (w) =>
      `${w.words} words is short. The profile describes texts averaging ${w.corpusMeanWords} words, and several features cannot mean the same thing on a passage this size. Read the breakdown, not the distance.`,
    "small-corpus": (w) =>
      `The profile is built from ${w.sources} texts, so its percentiles are coarse and a single unusual source moves them.`,
  },
  de: {
    "short-text": (w) =>
      `${w.words} Wörter sind wenig. Das Profil beschreibt Texte mit im Schnitt ${w.corpusMeanWords} Wörtern, und mehrere Merkmale können auf einer Passage dieser Größe nicht dasselbe bedeuten. Die Aufschlüsselung lesen, nicht den Abstand.`,
    "small-corpus": (w) =>
      `Das Profil ist aus ${w.sources} Texten gebaut, seine Perzentile sind also grob, und eine einzige ungewöhnliche Quelle verschiebt sie.`,
  },
};

export const STRINGS = {
  en: {
    "meta.title": "stylo: measure a text, see the numbers",
    "nav.source": "Source",
    "nav.github": "GitHub",
    "nav.linkedin": "LinkedIn",
    "nav.lang": "Deutsch",
    "theme.toLight": "Switch to the light theme",
    "theme.toDark": "Switch to the dark theme",

    "hero.kicker": "Stylometry, TypeScript, no dependencies",
    "hero.title": "Nineteen measurements.<br>No verdict.",
    "hero.lede":
      "Paste a text and see where each of its nineteen features sits against a corpus of human academic writing. It will not tell you who wrote it, and the part of this page worth reading is the part that explains why not.",
    "hero.cta": "Read the source",

    "try.eyebrow": "The instrument",
    "try.title": "Measure something",
    "try.body":
      "Two samples to start with, or paste your own. The dot on each track is this text; the pale band behind it is where the middle eighty per cent of the corpus falls.",
    "try.placeholder": "Paste a few hundred words here.",
    "try.measure": "Measure",
    "try.sampleEven": "Sample: uneven prose",
    "try.sampleUniform": "Sample: uniform prose",
    "try.clear": "Clear",
    "try.words": (n) => `${n} words`,
    "try.distanceLabel": "Distance",
    "try.awaiting": "Nothing measured yet.",
    "try.note": (out, total) =>
      `${out} of ${total} features fall outside the corpus band. That is the finding. The distance above is only a summary of it.`,
    "try.legendIn": "inside the band",
    "try.legendOut": "outside the band",
    "try.legendBand": "corpus, 10th to 90th percentile",

    "limits.eyebrow": "Read this before the numbers",
    "limits.title": "What it cannot tell you",
    "limits.l1t": "It cannot tell you whether a machine wrote it",
    "limits.l1b":
      "There is no output that says so. Unusual human writing scores far from the corpus. Ordinary machine writing scores close to it. Both are correct results and neither is a finding about authorship.",
    "limits.l2t": "A large distance is not evidence",
    "limits.l2b":
      "Detectors of this kind produce false positives unevenly. Writing by non-native speakers is flagged far more often, and students have been accused on the strength of exactly this sort of number. It does not support that, and neither does its author.",
    "limits.l3t": "The corpus is small and specific",
    "limits.l3b":
      "Ten English papers and thirteen German dissertations. It describes academic prose in two registers. A novel measured against it looks strange because it is a novel.",
    "limits.l4t": "Short passages cannot mean much",
    "limits.l4b":
      "Repeated sentence openings can only rise as sentences accumulate. One formal connective in forty words is a rate no whole paper could reach. Below 300 words the library attaches a warning, and the warning is the part to read.",

    "scale.eyebrow": "The scale",
    "scale.title": "What typical actually looks like",
    "scale.body":
      "A distance near 1 should mean the text sits where corpus texts sit. That is checkable, so it is checked: hold out each corpus text in turn, build the profile from the other twenty-two, and measure the held-out one against it. Every dot below is genuine human academic prose.",
    "scale.foot":
      "Median 1.30 in English, 1.14 in German. So around 1 is unremarkable and past about 2.5 a text is unusual on several features at once. Which features, not how far, is the answer.",
    "scale.keyEn": "English, 10 papers",
    "scale.keyDe": "German, 13 dissertations",

    "status.eyebrow": "State of the repo",
    "status.title": "What is built and what is not",
    "status.p1": "Nineteen features, each its own function, each tested by hand",
    "status.p2": "Corpus profiles for English and German, rebuildable from your own texts",
    "status.p3": "Distance with the per-feature breakdown, and no way to get one without the other",
    "status.p4": "Leave-one-out validation of the distance scale",
    "status.p5": "A per-sentence view, so a long text can point at its own outliers",
    "status.p6": "More corpora: one register per profile is the current limit",
    "status.done": "done",
    "status.todo": "not yet",

    "foot.built": "Built by",
    "foot.deps": "No runtime dependencies",
  },

  de: {
    "meta.title": "stylo: einen Text messen, die Zahlen sehen",
    "nav.source": "Quelltext",
    "nav.github": "GitHub",
    "nav.linkedin": "LinkedIn",
    "nav.lang": "English",
    "theme.toLight": "Zum hellen Thema wechseln",
    "theme.toDark": "Zum dunklen Thema wechseln",

    "hero.kicker": "Stylometrie, TypeScript, ohne Abhängigkeiten",
    "hero.title": "Neunzehn Messungen.<br>Kein Urteil.",
    "hero.lede":
      "Text einfügen und sehen, wo jedes der neunzehn Merkmale gegenüber einem Korpus menschlicher akademischer Prosa liegt. Wer den Text geschrieben hat, sagt es nicht, und der lesenswerte Teil dieser Seite ist der, der erklärt, warum nicht.",
    "hero.cta": "Quelltext ansehen",

    "try.eyebrow": "Das Messgerät",
    "try.title": "Etwas messen",
    "try.body":
      "Zwei Beispiele zum Anfangen, oder einen eigenen Text einfügen. Der Punkt auf jeder Spur ist dieser Text; das blasse Band dahinter ist der Bereich, in dem die mittleren achtzig Prozent des Korpus liegen.",
    "try.placeholder": "Hier ein paar hundert Wörter einfügen.",
    "try.measure": "Messen",
    "try.sampleEven": "Beispiel: ungleichmäßige Prosa",
    "try.sampleUniform": "Beispiel: gleichförmige Prosa",
    "try.clear": "Leeren",
    "try.words": (n) => `${n} Wörter`,
    "try.distanceLabel": "Abstand",
    "try.awaiting": "Noch nichts gemessen.",
    "try.note": (out, total) =>
      `${out} von ${total} Merkmalen liegen außerhalb des Korpusbandes. Das ist der Befund. Der Abstand oben fasst ihn nur zusammen.`,
    "try.legendIn": "im Band",
    "try.legendOut": "außerhalb",
    "try.legendBand": "Korpus, 10. bis 90. Perzentil",

    "limits.eyebrow": "Vor den Zahlen lesen",
    "limits.title": "Was das Werkzeug nicht kann",
    "limits.l1t": "Es kann nicht sagen, ob eine Maschine geschrieben hat",
    "limits.l1b":
      "Es gibt keine Ausgabe, die das behauptet. Ungewöhnliche menschliche Texte liegen weit weg vom Korpus. Unauffällige maschinelle Texte liegen nah dran. Beides sind korrekte Ergebnisse, und keines sagt etwas über die Urheberschaft.",
    "limits.l2t": "Ein großer Abstand ist kein Beweis",
    "limits.l2b":
      "Detektoren dieser Art erzeugen falsch positive Ergebnisse, und zwar ungleich verteilt. Texte von Nicht-Muttersprachlern werden deutlich häufiger auffällig, und Studierende sind auf Basis genau solcher Zahlen beschuldigt worden. Die Zahl trägt das nicht, und ihr Autor auch nicht.",
    "limits.l3t": "Das Korpus ist klein und speziell",
    "limits.l3b":
      "Zehn englische Aufsätze, dreizehn deutsche Dissertationen. Es beschreibt akademische Prosa in zwei Registern. Ein Roman wirkt dagegen fremd, weil er ein Roman ist.",
    "limits.l4t": "Kurze Passagen sagen wenig",
    "limits.l4b":
      "Wiederholte Satzanfänge können nur zunehmen, je mehr Sätze zusammenkommen. Ein formaler Konnektor in vierzig Wörtern ergibt eine Rate, die kein ganzer Aufsatz erreichen könnte. Unter 300 Wörtern hängt die Bibliothek eine Warnung an, und die Warnung ist der Teil, den man lesen sollte.",

    "scale.eyebrow": "Die Skala",
    "scale.title": "Wie typisch tatsächlich aussieht",
    "scale.body":
      "Ein Abstand um 1 soll heißen, dass der Text dort liegt, wo Korpustexte liegen. Das lässt sich prüfen, also wird es geprüft: jeden Korpustext nacheinander zurückhalten, das Profil aus den anderen zweiundzwanzig bauen und den zurückgehaltenen dagegen messen. Jeder Punkt unten ist echte menschliche akademische Prosa.",
    "scale.foot":
      "Median 1,30 auf Englisch, 1,14 auf Deutsch. Um 1 herum ist also unauffällig, und ab etwa 2,5 weicht ein Text auf mehreren Merkmalen gleichzeitig ab. Welche Merkmale, nicht wie weit, ist die Antwort.",
    "scale.keyEn": "Englisch, 10 Aufsätze",
    "scale.keyDe": "Deutsch, 13 Dissertationen",

    "status.eyebrow": "Stand des Repos",
    "status.title": "Was gebaut ist und was nicht",
    "status.p1": "Neunzehn Merkmale, jedes eine eigene Funktion, jedes von Hand getestet",
    "status.p2": "Korpusprofile für Englisch und Deutsch, aus eigenen Texten neu baubar",
    "status.p3": "Abstand samt Merkmalsaufschlüsselung, und keines ohne das andere zu bekommen",
    "status.p4": "Leave-one-out-Prüfung der Abstandsskala",
    "status.p5": "Eine Satzansicht, damit ein langer Text auf seine eigenen Ausreißer zeigen kann",
    "status.p6": "Weitere Korpora: ein Register pro Profil ist derzeit die Grenze",
    "status.done": "fertig",
    "status.todo": "offen",

    "foot.built": "Gebaut von",
    "foot.deps": "Keine Laufzeit-Abhängigkeiten",
  },
};
