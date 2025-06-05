// content_script.js

/**
 * removeStaticAdElements():
 *   Removes leftover ad overlays/banners inside the video player only.
 */
function removeStaticAdElements() {
  const player = document.querySelector(".html5-video-player");
  if (!player) return;

  const selectors = [
    ".ytp-ad-overlay-slot",
    ".ytp-ad-player-overlay",
    ".video-ads",
    "#player-ads",
    ".ytp-ad-module",
    ".ytp-ad-text",
    ".ytp-ad-image-overlay",
    ".ytp-blocked-ad-gradient"
  ];
  selectors.forEach(sel => {
    player.querySelectorAll(sel).forEach(el => el.remove());
  });
}

/**
 * playerIsShowingAnAd(playerEl):
 *   True if any class on the player element contains “ad”.
 */
function playerIsShowingAnAd(playerEl) {
  return Array.from(playerEl.classList).some(
    cls => cls.toLowerCase().includes("ad")
  );
}

/**
 * clickAnySkipButton():
 *   Finds and clicks any <button> whose innerText includes “skip” (case-insensitive).
 */
function clickAnySkipButton() {
  document.querySelectorAll("button").forEach(btn => {
    const txt = (btn.innerText || "").trim().toLowerCase();
    if (txt.includes("skip")) {
      btn.click();
    }
  });
}

/**
 * autoSkipOrSpeedUpAd():
 *   If player is in “ad” mode, click skip if available or speed up to 16×.
 *   When ad ends, revert playbackRate to 1×.
 */
function autoSkipOrSpeedUpAd() {
  const player = document.querySelector(".html5-video-player");
  const video = document.querySelector("video");
  if (!player || !video) return;

  // 1) Click any “Skip” button immediately
  clickAnySkipButton();

  // 2) Check if player’s classes include “ad”
  const isAdNow = playerIsShowingAnAd(player);

  if (isAdNow) {
    if (!autoSkipOrSpeedUpAd._wasAd) {
      autoSkipOrSpeedUpAd._wasAd = true;
      video.playbackRate = 16;
    }
  } else {
    if (autoSkipOrSpeedUpAd._wasAd) {
      autoSkipOrSpeedUpAd._wasAd = false;
      video.playbackRate = 1;
    }
  }
}
// Initialize the flag
autoSkipOrSpeedUpAd._wasAd = false;

/**
 * setUpObservers():
 *   1. Immediately run removeStaticAdElements() & autoSkipOrSpeedUpAd()
 *   2. Observe only the video-player subtree for new overlays & retry auto-skip
 *   3. Observe the player’s class attribute for ad-mode toggles
 */
function setUpObservers() {
  removeStaticAdElements();
  autoSkipOrSpeedUpAd();

  const player = document.querySelector(".html5-video-player");
  if (!player) return;

  // Observe changes inside player subtree
  const domObserver = new MutationObserver(() => {
    removeStaticAdElements();
    autoSkipOrSpeedUpAd();
  });
  domObserver.observe(player, { childList: true, subtree: true });

  // Observe player’s “class” attribute changes
  const attrObserver = new MutationObserver(() => {
    autoSkipOrSpeedUpAd();
  });
  attrObserver.observe(player, {
    attributes: true,
    attributeFilter: ["class"]
  });
}

// Run once on initial load
setUpObservers();

// Re-attach on YouTube SPA navigations
window.addEventListener("yt-navigate-finish", () => {
  setTimeout(setUpObservers, 500);
});
