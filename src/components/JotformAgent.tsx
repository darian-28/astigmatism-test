import { useEffect } from "react";

const SRC =
  "https://cdn.jotfor.ms/agent/embedjs/01a00f29875870008d3b1314a6b85fe0b3a6/embed.js";

/**
 * Loads the Jotform AI Agent embed script on the client so the floating
 * chatbot appears in the bottom-right corner on every page.
 */
export function JotformAgent() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
