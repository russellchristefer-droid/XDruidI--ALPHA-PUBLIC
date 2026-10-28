import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/changelog")({
  component: Changelog,
});

function Changelog() {
  return (
    <main className="pc-gate" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <article className="pc-card">
        <p className="pc-kicker">XDruid I · Alpha</p>
        <h1>What changed</h1>
        <p>
          This page is the public record of continuous work on the homestead. Newest first.
          Each entry is written so a returning player can see what is different since the last visit.
          Work-order identifiers link to the change that produced the entry.
        </p>
        <p>
          <Link to="/">Back to the yard</Link>
        </p>

        <h2>2026-10-27</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            A quiet local record of how the yard is used can now be kept if you choose it. It stays on your computer, covers the session, actions, portals, skills, saves, and how smoothly the yard runs, and shows a simple page of what happened. Nothing is sent away.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/c16d2a89691efb7d2ad9883940ab2fa4d14e2149">ANALYTICS-001</a>
          </li>
          <li>
            The words the yard uses can now be swapped for another language. English is the starting set, ready for others to be added later.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/b8644d150228df9de02d71e67ed433fe07e58196">I18N-001</a>
          </li>
        </ul>

        <h2>2026-10-26</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            The project knowledge base is now public and complete enough that a new developer can understand the whole alpha from the docs folder alone in one afternoon. Architecture, systems, content registry, save format, style, and freshness checks are dated and cross-linked.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/acc724f48a850e6771d99317da0194826d4a6097">DOC-KB-001</a>
          </li>
          <li>
            This public changelog page was added so a returning visitor can see at once what has changed. Entries are plain language, newest first, grouped by theme, and each links to the work that produced it. Older history is kept.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/f0edbaf92b76e6e86bd8c1c9bf5b3a0057d4c5b1">CHANGELOG-001</a>
          </li>
        </ul>

        <h2>2026-09-28</h2>
        <h3>Content</h3>
        <ul>
          <li>
            The SNES cartridge and the Python desktop window now mark the goat pen and Xiang Su, and the Python window walks the same yard and zooms with the wheel.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/5126bd73209996135e2bcb3cbf017f8bc904752f">SIDECAR-001</a>
          </li>
        </ul>

        <h2>2026-09-27</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            The yard is playable on phones and computers. Heavy plates are cached, fewer images load at once on a phone, touch buttons no longer cover the prompt, the pond is stocked from the fish sheet, and legal and security notes are published.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/f55f1faae29db552787e1d13250ff75f0942dbbd">PLAYABLE-001</a>
          </li>
          <li>
            An SNES LoROM cartridge sidecar was added. It walks the yard, west into Naraka, east into Svarga.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/92f48625fd6eadb932170f7da750f167f9b2f0ad">SNES-001</a>
          </li>
        </ul>
        <h3>Realism</h3>
        <ul>
          <li>
            Svarga and Naraka portals received matching lands, stone, vines, runes, rising light, gold toraṇa for the east gate, and a horned lintel for the west gate. Farm green was stripped from the Svarga flourish.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/395f1d891ca805e271e8cace8f8786c5c128a20b">PORTALS-001</a>
          </li>
        </ul>
        <h3>Fixes</h3>
        <ul>
          <li>
            Working undo, save, and stamp tools were added to the developer console. The console now explains the note and keeps a live view.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/91b5777f15100bc723a794d4b36527b960cae522">DEV-001</a>
          </li>
        </ul>

        <h2>2026-09-26</h2>
        <h3>Fixes</h3>
        <ul>
          <li>
            Farmer walk frames were corrected. The meadow remains grass and the path stays the path.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/cd2a90b16794b053d06249c016e77a94630bed91">FRAMES-001</a>
          </li>
        </ul>
        <h3>Systems</h3>
        <ul>
          <li>
            The farmer can now tend the beds. An autonomy switch was added. Day and night light, rain, and thunder that water the land were introduced. Wind audio with a volume slider and mute was added.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/0d7a70935aba43194e8528c7e9ea117f199d5bc8">AUTONOMY-001</a>
          </li>
        </ul>
        <h3>Content</h3>
        <ul>
          <li>
            Front and back walk frames for the goddess were added.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commit/60d5a9bdbe5051dc0a366cc1ae520733265d759b">GODDESS-001</a>
          </li>
        </ul>

        <p style={{ marginTop: "2rem", fontSize: "0.85rem", opacity: 0.7 }}>
          History is kept. Older entries remain. The east house (mansion foundation) is mentioned only when a change touches it.
        </p>
      </article>
    </main>
  );
}
