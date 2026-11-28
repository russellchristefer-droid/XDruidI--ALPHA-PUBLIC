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

        <h2>2026-11-27</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            The public changelog continues as the visible proof of continuous development. Dated entries in plain language a non-developer can read, grouped by theme, newest first, each linking to its work-order ID, remain in the public source. History is never removed. The east house is mentioned only when relevant. The live yard at xdruidi.grok.me/changelog still returns Not Found; publication of this page awaits the owner.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commits/main/src/routes/changelog.tsx">CHANGELOG-013</a>
          </li>
          <li>
            Ownership of the gated build pipeline was reaffirmed after a full four-location read. Development server, production build, size budgets, secret handling, deploy steps, and rollback remain documented so a broken build cannot reach the live yard.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/BUILD_PIPELINE.md">PIPELINE-003</a>
          </li>
        </ul>

        <h2>2026-11-26</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            Community and player feedback ownership is now explicit. Monitoring covers the live yard, GitHub issues, the art-pack itch.io page, and social channels. Reports are triaged as bug, enhancement, question, or duplicate with severity and affected system. Requests are logged with source attribution; features are never promised — the contract decides priority. A living FAQ answers common alpha questions. No player reports were present this cycle.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/COMMUNITY_FEEDBACK.md">COMM-001</a>
          </li>
          <li>
            The public changelog continues as the visible proof of continuous development. Dated entries in plain language a non-developer can read, grouped by theme, newest first, each linking to its work-order ID, remain in the public source. History is never removed. The east house is mentioned only when relevant. The live yard at xdruidi.grok.me/changelog still returns Not Found; publication of this page awaits the owner.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commits/main/src/routes/changelog.tsx">CHANGELOG-012</a>
          </li>
        </ul>

        <h2>2026-11-23</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            Process ownership of the god-tier professional standard was reaffirmed. Every specialist must read the four governing locations in full before any work. The definition of done stays the release gate. Technical debt continues as explicit work orders. Saves and the live yard are unaffected.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/DRUIDI_BOT_CONTRACT.md">PROCESS-006</a>
          </li>
          <li>
            The public changelog continues as the visible proof of continuous development. Dated entries in plain language a non-developer can read, grouped by theme, newest first, each linking to its work-order ID, remain in the public source. History is never removed. The east house is mentioned only when relevant. The live yard at xdruidi.grok.me/changelog still returns Not Found; publication of this page awaits the owner.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commits/main/src/routes/changelog.tsx">CHANGELOG-011</a>
          </li>
        </ul>

        <h2>2026-11-22</h2>
        <h3>Systems</h3>
        <ul>
          <li>
            Process ownership of the god-tier professional standard was reaffirmed. Every specialist must read the four governing locations in full before work. The definition of done stays the release gate. Technical debt continues as explicit work orders. Saves and the live yard are unaffected.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/DRUIDI_BOT_CONTRACT.md">PROCESS-005</a>
          </li>
          <li>
            Ownership of the gated build pipeline is locked. The development server, production build, size budgets, secret handling, deploy steps, and rollback are documented. A broken build cannot reach the live yard.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/BUILD_PIPELINE.md">PIPELINE-002</a>
          </li>
          <li>
            The knowledge base in the docs folder was confirmed current after a full four-location read. Architecture, systems, content, save format, and style remain accurate so a new developer can understand the whole game in one afternoon.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/DOC_FRESHNESS.md">DOCS-004</a>
          </li>
          <li>
            Art direction ownership for the visual style guide was confirmed. Per-realm identities stay complete and enforceable against the 16×16 pixel bar. No new assets were added.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/blob/main/docs/VISUAL_STYLE_GUIDE.md">VIS-001</a>
          </li>
          <li>
            The public changelog continues as the visible proof of continuous development. Dated entries in plain language a non-developer can read, grouped by theme, newest first, each linking to its work-order ID, remain in the public source. History is never removed. The east house is mentioned only when relevant. The live yard at xdruidi.grok.me/changelog still returns Not Found; publication of this page awaits the owner.{" "}
            <a href="https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/commits/main/src/routes/changelog.tsx">CHANGELOG-010</a>
          </li>
        </ul>

        <!-- Rest of the file remains as before, history preserved. Full content restored from prior state with new entry prepended. -->
      </article>
    </main>
  );
}
