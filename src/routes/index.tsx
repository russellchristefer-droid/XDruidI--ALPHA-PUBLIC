import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AssayGame } from "@/components/AssayGame";

export const Route = createFileRoute("/")({ component: Home });

/** Phones and tablets. A narrow desktop window still plays. */
function isHandheld(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return true;
  const nav = navigator as Navigator & { platform?: string; maxTouchPoints?: number };
  if (nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1) return true;
  if (typeof matchMedia !== "function") return false;
  return matchMedia("(pointer: coarse)").matches && matchMedia("(hover: none)").matches;
}

function Home() {
  const [desk, setDesk] = useState<boolean | null>(null);
  useEffect(() => {
    setDesk(!isHandheld());
  }, []);
  if (desk === null) return <main className="pc-gate" />;
  if (!desk) return <PcNotice />;
  return <AssayGame />;
}

function PcNotice() {
  const [copied, setCopied] = useState(false);
  const address = typeof window !== "undefined" ? window.location.href : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <main className="pc-gate">
      <article className="pc-card">
        <p className="pc-kicker">XDruid I · Alpha</p>
        <h1>This game is for a personal computer.</h1>
        <p>
          Please open this address in a desktop browser. The homestead is played with a keyboard and a mouse.
          A phone or a tablet can show this note, but the yard is not offered on a small screen.
        </p>
        <p className="pc-address" aria-label="Game address">
          {address}
        </p>
        <button type="button" className="pc-copy" onClick={() => void copy()}>
          {copied ? "Address copied" : "Copy address"}
        </button>
        <p className="pc-fine">The save stays in the browser on that computer. Nothing is started from this screen.</p>
      </article>
    </main>
  );
}
