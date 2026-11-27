interface Preview {
  card: HTMLElement;
  button: HTMLButtonElement;
  video: HTMLVideoElement;
  ratio: number;
  pausedByUser: boolean;
  unavailable: boolean;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const autoplayButton = document.querySelector<HTMLButtonElement>('[data-home-autoplay]');
const previews: Preview[] = [];
let active: { preview: Preview; manual: boolean } | null = null;
let autoplayEnabled = true;
let lastMission: Preview | null = null;

function refreshAutoplayButton() {
  if (!autoplayButton) return;
  const enabled = autoplayEnabled && !reducedMotion.matches;
  autoplayButton.disabled = reducedMotion.matches;
  autoplayButton.setAttribute('aria-pressed', String(enabled));
  autoplayButton.textContent = enabled ? 'Autoplay on' : 'Autoplay off';
}

function stopPreview() {
  if (!active) return;
  const { card, button, video } = active.preview;
  active = null;
  video.pause();
  card.removeAttribute('data-playing');
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Play preview';
}

function startPreview(preview: Preview, manual = false) {
  if (active?.preview === preview) return;
  stopPreview();
  const { video, card } = preview;
  active = { preview, manual };
  video.muted = true;
  video.loop = manual || card.dataset.homePreview === 'feature';
  if (!video.getAttribute('src')) video.src = video.dataset.clip!;
  if (video.ended) video.currentTime = 0;
  void video.play().catch(error => {
    if (active?.preview !== preview) return;
    if (!manual && error instanceof DOMException && error.name === 'NotAllowedError') {
      autoplayEnabled = false;
      refreshAutoplayButton();
    } else if (video.error) {
      preview.unavailable = true;
    }
    stopPreview();
  });
}

function playVisiblePreview() {
  if (active || !autoplayEnabled || reducedMotion.matches || document.hidden) return;
  const eligible = previews.filter(preview => preview.ratio >= .36 && !preview.pausedByUser && !preview.unavailable);
  const feature = eligible.find(preview => preview.card.dataset.homePreview === 'feature');
  const nextMission = eligible.find(preview => previews.indexOf(preview) > (lastMission ? previews.indexOf(lastMission) : -1));
  const next = feature ?? nextMission ?? eligible[0];
  if (next) startPreview(next);
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const preview = previews.find(candidate => candidate.card === entry.target);
    if (preview) preview.ratio = entry.intersectionRatio;
  }
  if (active && active.preview.ratio < (active.manual ? .01 : .18)) stopPreview();
  playVisiblePreview();
}, { threshold: [0, .01, .18, .36] });

for (const card of document.querySelectorAll<HTMLElement>('[data-home-preview]')) {
  const video = card.querySelector<HTMLVideoElement>('video[data-clip]');
  const button = card.querySelector<HTMLButtonElement>('[data-preview-toggle]');
  const feedback = card.querySelector<HTMLElement>('[data-preview-error]');
  if (!video?.dataset.clip || !button) continue;

  const preview = { card, video, button, ratio: 0, pausedByUser: false, unavailable: false };
  previews.push(preview);
  button.hidden = false;
  observer.observe(card);

  video.addEventListener('playing', () => {
    if (active?.preview !== preview) return;
    card.setAttribute('data-playing', '');
    button.setAttribute('aria-pressed', 'true');
    button.title = 'Pause preview';
  });
  video.addEventListener('ended', () => {
    if (active?.preview !== preview) return;
    lastMission = preview;
    stopPreview();
    playVisiblePreview();
  });
  video.addEventListener('error', () => {
    if (active?.preview !== preview) return;
    preview.unavailable = true;
    if (feedback) feedback.hidden = false;
    stopPreview();
    playVisiblePreview();
  });
  button.addEventListener('click', () => {
    if (active?.preview === preview) {
      preview.pausedByUser = true;
      stopPreview();
      return;
    }
    preview.pausedByUser = false;
    if (preview.unavailable) {
      video.removeAttribute('src');
      preview.unavailable = false;
      if (feedback) feedback.hidden = true;
    }
    startPreview(preview, true);
  });
}

if (autoplayButton) {
  autoplayButton.hidden = false;
  refreshAutoplayButton();
  autoplayButton.addEventListener('click', () => {
    autoplayEnabled = !autoplayEnabled;
    if (!autoplayEnabled && !active?.manual) stopPreview();
    refreshAutoplayButton();
    playVisiblePreview();
  });
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && !active?.manual) stopPreview();
  refreshAutoplayButton();
  playVisiblePreview();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPreview();
  else playVisiblePreview();
});

