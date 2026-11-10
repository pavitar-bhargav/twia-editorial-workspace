export type StoredClip = {
  id: string;
  url?: string;
  title: string;
  text: string;
  status: "ready" | "needs_paste";
  note?: string;
  origin: "manual" | "bookmarklet" | "extension";
  createdAt: string;
};

const clips: StoredClip[] = [];

export function listClips(): StoredClip[] {
  return clips;
}

export function addClip(clip: StoredClip) {
  clips.unshift(clip);
  if (clips.length > 80) clips.pop();
}

export function clearClips() {
  clips.length = 0;
}
