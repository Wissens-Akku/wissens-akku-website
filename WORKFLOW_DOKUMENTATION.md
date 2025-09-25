# Detaillierte Workflow-Dokumentation: Podcast Content Automation

Dieses Dokument beschreibt den gesamten Prozess der automatisierten Podcast-Erstellung, von der Ideenfindung bis zur finalen Audio-Datei. Der Prozess ist in zwei Hauptphasen unterteilt.

---

## Phase 1: KI-gestützte Themenfindung

Diese Phase dient dazu, neue, relevante Themenvorschläge zu generieren, die noch nicht im Podcast behandelt wurden.

**Auslöser:** Der Benutzer klickt im Web-Interface auf den Button "Neue Themen suchen".

**Ablauf:**

1.  **Start des Prozesses:** Die Anfrage wird an den `/find-new-topics` Endpunkt in `app.py` gesendet.

2.  **Datensammlung:**
    *   Das System liest alle bereits produzierten Episodentitel aus der `Wissens-Akku-Episoden.xlsx`.
    *   Zusätzlich werden alle bisherigen, noch nicht umgesetzten Vorschläge aus der `Neue_Themen_Vorschlaege.xlsx` gelesen.
    *   Beide Listen werden zu einer einzigen, deduplizierten Liste bekannter Themen zusammengefügt.

3.  **KI-Prompt-Vorbereitung:**
    *   Der spezielle Prompt zum Finden neuer Themen (`Themen_vorschlagen_prompt.json`) wird geladen.
    *   Dieser Prompt enthält einen Platzhalter `[BEREITS VORHANDENE THEMEN]`.
    *   Das System ersetzt diesen Platzhalter durch die zuvor erstellte Liste aller bekannten Themen. Dies stellt sicher, dass die KI keine bereits behandelten oder vorgeschlagenen Themen erneut liefert.

4.  **KI-API-Aufruf (Gemini):**
    *   Der vorbereitete Prompt wird an die Gemini-API gesendet.
    *   Die KI analysiert die Liste der vorhandenen Themen und die im Prompt definierte Zielsetzung des Podcasts.
    *   Als Antwort liefert die KI eine Liste neuer Themenvorschläge im JSON-Format zurück. Jeder Vorschlag enthält das `thema` und die passende `kategorie`.

5.  **Speicherung der Ergebnisse:**
    *   Das System empfängt die JSON-Antwort von Gemini.
    *   Die Funktion `write_suggestions_to_excel` wird aufgerufen.
    *   Diese Funktion öffnet die bestehende `Neue_Themen_Vorschlaege.xlsx`, fügt die neuen Vorschläge in die Spalten der entsprechenden Kategorien ein und speichert die Datei. Das Spaltenformat bleibt dabei erhalten.

**Ergebnis:** Die `Neue_Themen_Vorschlaege.xlsx` ist mit neuen, relevanten Ideen gefüllt und bereit für die nächste Phase.

---

## Phase 2: KI-gestützte Content-Generierung

In dieser Phase wird aus einem Thema ein komplettes Set an Produktionsdateien (Recherche, Skripte, Wörterbuch) und optional die finale Audiodatei erstellt.

**Auslöser:**
*   **Möglichkeit A (aus Vorschlägen):** Der Benutzer klickt auf "Vorschläge verarbeiten". Der Prozess startet über den `/process-suggestions` Endpunkt.
*   **Möglichkeit B (aus PDF-Warteschlange):** Der Benutzer fügt über das Formular eine PDF-Datei und Metadaten zur `Warteschlange.json` hinzu und klickt auf "Automatisierung starten". Der Prozess startet über den `/start-process` Endpunkt.
*   **Möglichkeit C (manuell):** Der Benutzer gibt ein Thema und eine Kategorie manuell ein und startet den Prozess über den `/manual-research` Endpunkt.

**Ablauf (am Beispiel von Möglichkeit A):**

1.  **Laden der Aufgaben:** Das System liest die `Neue_Themen_Vorschlaege.xlsx` und erstellt eine strukturierte Liste von zu verarbeitenden Themen.

2.  **Verarbeitungsschleife:** Das System arbeitet die Liste Thema für Thema ab. Für jedes Thema geschieht Folgendes:
    *   **Aufgabe entnehmen:** Das aktuelle Thema wird aus der Liste genommen.
    *   **Ordnerstruktur anlegen:** Ein neuer, nummerierter Ordner für das Thema wird im passenden Kategorie-Verzeichnis erstellt (z.B. `C:\...\Audio\#1 Supplements\#53 Neues Thema`).

3.  **Die 5-stufige Skript-Pipeline (`process_topic_stream`):** Dies ist der Kern der Content-Erstellung. Jeder Schritt wird per Live-Log an das Web-Interface gestreamt.

    *   **Schritt 1: Deep Research:**
        *   *Wenn keine PDF vorhanden ist:* Ein kategoriespezifischer "Deep Research Prompt" wird geladen, mit dem Thema befüllt und an die Gemini-API gesendet.
        *   *Wenn eine PDF vorhanden ist:* Der Text wird direkt aus der PDF-Datei extrahiert.
        *   Das Ergebnis (ein ausführlicher Recherchetext) wird als `01_Recherche.txt` gespeichert.

    *   **Schritt 2: Podcast-Skript generieren:**
        *   Der Recherchetext aus Schritt 1 wird in den "Skript generieren"-Prompt (`Skribt_generieren_promt.json`) eingesetzt.
        *   Ein erneuter API-Aufruf an Gemini generiert ein vollständiges Podcast-Skript im Dialogformat (Sprecher 1 / Sprecher 2).
        *   Das Ergebnis wird als `02_Podcast_Skript_Roh.txt` gespeichert.

    *   **Schritt 3: Qualitätssicherung (QS):**
        *   Das rohe Skript aus Schritt 2 wird in den "QS-Prompt" eingesetzt.
        *   Ein dritter API-Aufruf an Gemini prüft das Skript auf Logik, Stil und Einhaltung der Vorgaben.
        *   Die KI liefert eine korrigierte Version des Skripts und ein separates Änderungsprotokoll zurück.
        *   Die Ergebnisse werden als `03_Podcast_Skript_QS.txt` und `QS_Protokoll.md` gespeichert.

    *   **Schritt 4: Skript für TTS optimieren:**
        *   Das QS-geprüfte Skript wird in den "Skript optimieren"-Prompt eingesetzt.
        *   Ein vierter API-Aufruf an Gemini passt das Skript speziell für eine natürliche Aussprache durch eine Text-to-Speech (TTS) Engine an (z.B. durch das Ausschreiben von Zahlen oder das Vereinfachen komplexer Satzstrukturen).
        *   Das finale Skript wird unter dem Episodennamen gespeichert (z.B. `#{Nummer} {Thema}.txt`).

    *   **Schritt 5: Wörterbuch generieren:**
        *   Das finale Skript wird in den "Wörterbuch"-Prompt eingesetzt.
        *   Ein fünfter API-Aufruf an Gemini extrahiert alle Fachbegriffe, Fremdwörter oder potenziell schwer auszusprechenden Wörter.
        *   Die KI erstellt eine Liste mit diesen Wörtern und deren korrekter phonetischer Schreibweise.
        *   Das Ergebnis wird als `Woerterbuch.txt` gespeichert.

4.  **Audio-Generierung (Optional):**
    *   Wenn die Option im Web-Interface aktiviert ist, sendet das System eine Anfrage an ein separates Programm, das auf Port 5000 läuft.
    *   Diese Anfrage enthält die Pfade zum finalen Skript und zum Wörterbuch.
    *   Das externe Programm nutzt diese Dateien, um mithilfe einer TTS-API (z.B. von Google) die eigentliche Audio-Datei (MP3) zu erzeugen und im Themenordner abzulegen. Es werden standardmäßig 3 verschiedene Stimm-Versionen angefragt.

5.  **Abschluss und Aufräumarbeiten:**
    *   Nachdem alle Schritte erfolgreich waren, wird das Thema aus der `Neue_Themen_Vorschlaege.xlsx` entfernt.
    *   Gleichzeitig wird das Thema zur `Wissens-Akku-Episoden.xlsx` hinzugefügt, um es als "produziert" zu markieren.
    *   Falls eine PDF verwendet wurde, wird diese aus dem `Input-PDFs`-Ordner in einen Archivordner verschoben.

**Ergebnis:** Ein neuer Ordner mit allen generierten Textdateien und (optional) der fertigen WAV-Datei. Die Excel-Listen sind auf dem neuesten Stand.