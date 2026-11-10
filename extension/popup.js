const originInput = document.querySelector("#origin");
const clipButton = document.querySelector("#clip");
const status = document.querySelector("#status");
const DEFAULT_ORIGIN = "http://localhost:3000";

chrome.storage.local.get({ origin: DEFAULT_ORIGIN }, (stored) => {
  originInput.value = stored.origin || DEFAULT_ORIGIN;
});

originInput.addEventListener("change", () => {
  chrome.storage.local.set({ origin: originInput.value.replace(/\/$/, "") });
});

clipButton.addEventListener("click", async () => {
  clipButton.disabled = true;
  status.textContent = "Reading the page…";
  const origin = (originInput.value || DEFAULT_ORIGIN).replace(/\/$/, "");
  chrome.storage.local.set({ origin });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab.");
    const [injected] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        url: location.href,
        title: document.title || "",
        selectedText: String(window.getSelection ? window.getSelection() : ""),
      }),
    });
    const page = injected?.result;
    if (!page?.url) throw new Error("Could not read this tab.");

    const response = await fetch(`${origin}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...page, origin: "extension" }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `The desk returned ${response.status}.`);
    }
    status.textContent = payload.clip?.status === "needs_paste"
      ? "Saved. The page would not yield text — paste it on the desk."
      : "Clipped. It will show in the desk inbox.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "The clip failed.";
  } finally {
    clipButton.disabled = false;
  }
});
