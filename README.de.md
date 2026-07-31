# stylo

[English](./README.md) · **Deutsch**

Misst neunzehn Eigenschaften eines Textes und zeigt, wo jede davon gegenüber einem Korpus menschlicher akademischer Prosa liegt. Wer den Text geschrieben hat, sagt es nicht.

TypeScript, **keine Laufzeit-Abhängigkeiten**, Deutsch und Englisch.

**[Im Browser ausprobieren](https://arsalanrc.github.io/stylo/)**: Text einfügen, jedes Merkmal gegen sein Korpusband sehen. Ohne Installation.

```bash
pnpm add github:ArsalanRC/stylo
```

## Was das Werkzeug nicht kann

Das gehört nach vorne, denn die Antwort, die man von so einem Werkzeug will, ist genau die, die es nicht geben kann.

**Es kann nicht sagen, ob ein Text von einer Maschine stammt.** Es gibt keine Ausgabe, die das behauptet. Berichtet wird ein Abstand zu einer gemessenen Verteilung und die neunzehn Zahlen, aus denen dieser Abstand besteht. Ungewöhnliche menschliche Texte liegen weit weg vom Korpus. Unauffällige maschinelle Texte liegen nah dran. Beides sind korrekte Ergebnisse, und keines sagt etwas über die Urheberschaft.

**Ein großer Abstand ist kein Beweis.** Stylometrische Detektoren erzeugen falsch positive Ergebnisse, und zwar ungleich verteilt: Texte von Nicht-Muttersprachlern werden deutlich häufiger auffällig, und Studierende sind schon auf Basis genau solcher Zahlen beschuldigt worden. Wer eine Zahl aus dieser Bibliothek in der Hand hält und überlegt, jemanden damit zu konfrontieren: die Zahl trägt das nicht, und ihr Autor auch nicht.

**Das Korpus ist klein und speziell.** Zehn englische Aufsätze, dreizehn deutsche Dissertationen. Es beschreibt akademische Prosa in diesen beiden Registern und sonst nichts. Ein Roman wirkt dagegen fremd, weil er ein Roman ist.

**Mehrere Merkmale sagen bei kurzen Passagen wenig.** Wiederholte Satzanfänge können nur zunehmen, je mehr Sätze zusammenkommen; ein formaler Konnektor in vierzig Wörtern ergibt eine Rate, die kein ganzer Aufsatz erreichen könnte. Unter 300 Wörtern hängt `compare` eine Warnung an, und die Warnung ist der Teil, den man lesen sollte.

Wofür es taugt, ist die Arbeit am eigenen Text. "Deine Sätze sind alle gleich lang, und *zudem* steht bei dir viermal häufiger als in jedem Aufsatz des Korpus" ist brauchbar und überprüfbar. "Das ist zu 87% KI" ist beides nicht.

## Die drei Aufrufe

```ts
import { compare, measure, profileFor } from "@arsalanrc/stylo";

// Ein Text, neunzehn Zahlen.
measure("Dein Text hier.", "de");
// → { sent_len_mean: 3, sent_len_std: 0, mattr: 1, ... }

// Ein Text, eingeordnet ins mitgelieferte Korpus.
const result = compare(langerText, profileFor("de"));

result.distance; // 1.24
result.warnings; // leer, sobald der Text lang genug ist

for (const f of result.features) {
  // Sortiert danach, wie weit jedes Merkmal vom Korpus entfernt liegt.
  console.log(f.label, f.value, f.band.p10, f.band.p90, f.insideBand);
}
```

Es gibt keine Funktion, die nur den Abstand zurückgibt. Das ist Absicht und kein Versehen: eine zusammenfassende Zahl ohne ihre Herleitung ist genau das, wozu diese Bibliothek die Alternative sein soll, und eine API, die das bequem macht, würde auch so benutzt.

## Wie ein Abstand zu lesen ist

Der Abstand ist das quadratische Mittel der neunzehn Standardwerte. Auf dieser Skala ist 1 das, was ein Text zeigt, der aus derselben Verteilung stammt wie das Korpus.

Diese Behauptung lässt sich prüfen, also wird sie geprüft. `scripts/validate.mjs` hält jeden Korpustext nacheinander zurück, baut das Profil aus dem Rest und misst den zurückgehaltenen Text dagegen. Alle sind echte menschliche akademische Prosa, ihre Abstände zeigen also, wie "typisch" tatsächlich aussieht:

| | min | Median | Mittel | max |
|---|---|---|---|---|
| Englisch, 10 zurückgehalten | 0,98 | 1,30 | 1,29 | 1,96 |
| Deutsch, 13 zurückgehalten | 0,54 | 1,14 | 1,29 | 2,54 |

Also: um 1 herum ist unauffällig, und ab etwa 2,5 weicht ein Text auf mehreren Merkmalen gleichzeitig vom Korpus ab. Welche das sind, steht im Array `features`, und das ist die Antwort, nicht der Abstand.

## Was gemessen wird

Neunzehn Merkmale, jedes eine schlichte deskriptive Statistik, jedes als eigene exportierte Funktion.

| | |
|---|---|
| Satzbau | Mittel, Streuung, Variation, Anteil der Sätze unter 7 und über 28 Wörtern |
| Wortschatz | lexikalische Vielfalt (MATTR-50), mittlere Wortlänge, Anteil der Wörter über 14 Zeichen |
| Wortklassen | formale Konnektoren, Modalpartikeln, Passivkonstruktionen, Nominalisierungen, Subjunktionen |
| Zeichensetzung | Kommata pro Satz, Bandbreite der Satzzeichen, Gedankenstriche |
| Aufbau | Variation der Absatzlänge, ausbalancierte Paare, wiederholte Satzanfänge |

Keines trägt eine Richtung oder ein Gewicht. Ein Merkmal, das weiß, welche Seite die schlechte ist, hat ein Argument eingebaut, das der Aufrufende nicht sieht, und das Argument gehört hier der Leserin.

Die Wortlisten sind exportiert (`FORMAL_CONNECTORS`, `HEDGES`, `SUBORDINATORS`), damit jeder nachsehen kann, was tatsächlich gezählt wurde. Passiv und Nominalisierungen sind Näherungen, so auch im Quelltext dokumentiert: Suffix- und Lexikonabgleich, kein Parser. Diese Verzerrung ist über Texte einer Sprache hinweg ungefähr konstant, und da ein Text gegen ein Korpus gemessen wird, das dieselben Funktionen vermessen haben, hebt eine konstante Verzerrung sich auf.

## Das Profil sind Statistiken, nicht Texte

Ein Profil enthält Mittelwert, Standardabweichung sowie das zehnte, fünfzigste und neunzigste Perzentil jedes Merkmals über eine Menge Referenztexte. Die Texte selbst enthält es nicht.

Das ist die zentrale Entwurfsentscheidung, und sie erledigt drei Dinge gleichzeitig. Die Referenztexte sind veröffentlichte Aufsätze und Dissertationen, ihre Weitergabe steht mir nicht zu, während neunzehn aggregierte Zahlen pro Text keine rekonstruierbare Prosa enthalten. Es sind wenige Kilobyte JSON, die Browser-Demo lädt sie also ohne Netzwerkaufruf. Und es macht das Werkzeug umlenkbar: `scripts/build-profile.mjs` auf zehn eigene Berichte richten, und der elfte wird gegen das eigene Register gemessen statt gegen Dissertationen, was fast immer die nützlichere Frage ist.

```bash
node scripts/build-profile.mjs ./mein-korpus de
```

Die Einheit ist der Text, nicht der Satz. Zehn Aufsätze ergeben zehn Beobachtungen pro Merkmal, und die Streuung, auf die es ankommt, ist die Variation zwischen Autoren, denn dagegen wird ein neuer Text gestellt. Alle Sätze zusammenzuwerfen würde die Variation innerhalb eines Dokuments messen und viel engere Bänder ergeben, die etwas anderes bedeuten.

## Zwei Fehler, die das Korpus gefunden hat

Beide kamen dadurch ans Licht, dass das Referenzkorpus vermessen und die Ausreißer angesehen wurden, nicht durch einen Unit-Test. Beide sind jetzt durch Regressionstests abgedeckt.

**Ein Inhaltsverzeichnis las sich als fünfzig Ein-Wort-Sätze.** Eine englische Quelle meldete eine mittlere Satzlänge von 5,5 Wörtern bei einem Korpusmittel von 20. Es war ein Inhaltsverzeichnis mit Füllpunkten: `Corpus composition . . . . . . 40`. Jedes `. ` sah aus wie eine Satzgrenze. Die Regel, die das behebt: ein Punkt mit Leerzeichen davor beendet nie einen Satz.

**Deutsche Fußnoten verschmolzen Sätze.** Eine deutsche Quelle meldete ein Mittel von 46 Wörtern und einen Satz mit 457. Beim Extrahieren deutscher Fachtexte aus PDFs rutschen hochgestellte Fußnotenzeichen auf den Punkt, `Phänomens.82 Aus der` hat also kein Leerzeichen nach dem Punkt, und bis zum nächsten unzitierten Satz wird keine Grenze gefunden. Es braucht zwei Bedingungen, sonst trennt auch `Abschnitt 1.2 zeigt`: ein Fußnotenzeichen steht hinter einem Buchstaben, und der nächste Satz beginnt groß.

Beides ist derselbe Fehlertyp, und aufschreiben sollte man ihn deshalb, weil keiner der beiden Fälle abstürzt. Sie liefern eine plausible Zahl, und eine plausible Zahl ist in einem Messwerkzeug schlimmer als ein Absturz.

## Tests

61 Tests, auf Node 18, 20 und 22.

```bash
pnpm install
pnpm test
```

Jeder erwartete Wert in den Merkmalstests ist im Test von Hand ausgerechnet und ausgeschrieben, nie ein Wert, der aus einem Lauf zurückkopiert wurde. Für ein stylometrisches Merkmal gibt es keine Referenzimplementierung zum Vergleichen, ein Test, der einfach festhält, was der Code produziert hat, würde also nur beweisen, dass der Code deterministisch ist.

## Lizenz

MIT

Gebaut von [Arsalan Khadim](https://www.linkedin.com/in/muhammad-arsalan-khadim-b87550259/) · [GitHub](https://github.com/ArsalanRC)
