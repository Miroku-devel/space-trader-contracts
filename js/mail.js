// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const MAIL_SAVE_KEY = "stc_mail";
let mailPageIdx = 0;
let mailAnimating = false;
let mailMessages = [];
function saveMailState() {
  try {
    localStorage.setItem(MAIL_SAVE_KEY, JSON.stringify(mailMessages));
  } catch (e) {}
}
function loadMailState() {
  const raw = localStorage.getItem(MAIL_SAVE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) mailMessages = data;
  } catch (e) {}
}
function updateMailButton() {
  const btn = document.getElementById("btn-mail");
  const hudBtn = document.getElementById("hud-btn-mail");
  if (!btn) return;
  const unread = mailMessages.filter((m) => !m.read).length;
  btn.classList.toggle("has-unread", unread > 0);
  if (hudBtn) hudBtn.classList.toggle("has-unread", unread > 0);
}
function addMailMessage(subject, body) {
  mailMessages.push({ subject, body, turn: turnCounter, read: false });
  if (mailMessages.length > 8) mailMessages.shift();
  saveMailState();
  updateMailButton();
}
function getMailMaxPage() {
  return mailMessages.length;
}
function mailSlideOutAndIn(dir) {
  if (mailAnimating) return;
  const maxPage = getMailMaxPage();
  const newIdx = Math.max(0, Math.min(maxPage, mailPageIdx + dir));
  if (newIdx === mailPageIdx) return;
  mailAnimating = true;
  const slider = document.getElementById("mail-slider");
  if (!slider) {
    mailAnimating = false;
    return;
  }
  const w = document.getElementById("mail-content").clientWidth;
  const outX = -dir * w;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlideOut() {
    slider.removeEventListener("transitionend", onSlideOut);
    mailPageIdx = newIdx;
    renderMailPages();
    const newSlider = document.getElementById("mail-slider");
    if (!newSlider) {
      mailAnimating = false;
      return;
    }
    const inX = -outX;
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${inX}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      mailAnimating = false;
    });
  });
}
function renderMailPages() {
  const slider = document.getElementById("mail-slider");
  if (!slider) return;
  if (mailPageIdx === 0) {
    const titleEl = document.getElementById("mail-title");
    if (titleEl) titleEl.textContent = "Mail";
    let html = `<div class="mail-page"><div class="mail-inbox">`;
    if (mailMessages.length !== 0) {
      for (let i = mailMessages.length - 1; i >= 0; i--) {
        const msg = mailMessages[i];
        html += `<div class="mail-entry${msg.read ? "" : " unread"}" data-idx="${i}"><span class="mail-entry-subject">${msg.subject}</span><span class="mail-entry-time">${typeof getDateString === "function" ? getDateString(msg.turn) : "Turn " + msg.turn}</span></div>`;
      }
    } else {
      html += `<div class="mail-empty">Empty</div>`;
    }
    html += `</div></div>`;
    slider.innerHTML = html;
    slider.querySelectorAll(".mail-entry").forEach((el) => {
      el.addEventListener("click", () =>
        goToMailPage(mailMessages.length - parseInt(el.dataset.idx)),
      );
    });
  } else {
    const msg = mailMessages[mailMessages.length - mailPageIdx];
    if (msg) {
      if (!msg.read) {
        msg.read = true;
        saveMailState();
        updateMailButton();
      }
      const titleEl = document.getElementById("mail-title");
      if (titleEl) titleEl.textContent = `Mail: ${msg.subject}`;
      slider.innerHTML = `<div class="mail-page"><div class="mail-message"><div class="mail-msg-body">${msg.body}</div></div></div>`;
    }
  }
  const unreadCount = mailMessages.filter((m) => !m.read).length;
  const statusEl = document.getElementById("mail-status");
  if (statusEl) {
    if (mailPageIdx === 0) {
      if (mailMessages.length === 0) statusEl.textContent = "No messages";
      else if (unreadCount === 0) statusEl.textContent = "All messages read";
      else if (unreadCount === 1) statusEl.textContent = "1 unread message";
      else statusEl.textContent = `${unreadCount} unread messages`;
    } else {
      const msg = mailMessages[mailMessages.length - mailPageIdx];
      if (msg)
        statusEl.textContent =
          typeof getDateString === "function"
            ? getDateString(msg.turn)
            : "Turn " + msg.turn;
    }
  }
  const homeBtn = document.getElementById("btn-mail-home");
  if (homeBtn) homeBtn.disabled = mailPageIdx === 0;
  const prevBtn = document.getElementById("btn-mail-prev");
  const nextBtn = document.getElementById("btn-mail-next");
  if (prevBtn) prevBtn.disabled = mailPageIdx === 0;
  if (nextBtn)
    nextBtn.disabled =
      mailPageIdx === getMailMaxPage() || mailMessages.length === 0;
  const markReadBtn = document.getElementById("btn-mail-mark-read");
  if (markReadBtn) markReadBtn.disabled = unreadCount === 0;
  const deleteBtn = document.getElementById("btn-mail-delete");
  if (deleteBtn)
    deleteBtn.disabled = mailPageIdx === 0 || mailMessages.length === 0;
  const deleteAllBtn = document.getElementById("btn-mail-delete-all");
  if (deleteAllBtn) deleteAllBtn.disabled = mailMessages.length === 0;
}
function goToMailPage(targetIdx) {
  const maxPage = getMailMaxPage();
  if (
    mailAnimating ||
    targetIdx < 0 ||
    targetIdx > maxPage ||
    targetIdx === mailPageIdx
  )
    return;
  const dir = targetIdx > mailPageIdx ? 1 : -1;
  const slider = document.getElementById("mail-slider");
  if (!slider) return;
  const w = document.getElementById("mail-content").clientWidth;
  const outX = -dir * w * Math.abs(targetIdx - mailPageIdx);
  mailAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    mailPageIdx = targetIdx;
    renderMailPages();
    const newSlider = document.getElementById("mail-slider");
    if (!newSlider) {
      mailAnimating = false;
      return;
    }
    const inX = -outX;
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${inX}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      mailAnimating = false;
    });
  });
}
function renderMail() {
  document.getElementById("mail-sidebar").innerHTML =
    `<button id="btn-mail-home"></button><button id="btn-mail-mark-read"></button><button id="btn-mail-delete"></button><button id="btn-mail-delete-all"></button>`;
  const homeBtn = document.getElementById("btn-mail-home");
  if (homeBtn) {
    homeBtn.innerHTML = ICON_MAIL;
    homeBtn.addEventListener("click", () => goToMailPage(0));
  }
  document.getElementById("mail-content").innerHTML = `
        <div id="mail-header">
            <div id="mail-header-left">
                <span id="mail-title">Mail</span>
                <span id="mail-status">No messages</span>
            </div>
            <div id="mail-header-right">
                <button id="btn-mail-prev"></button>
                <button id="btn-mail-next"></button>
                <button id="btn-mail-close"></button>
            </div>
        </div>
        <div id="mail-slider"></div>`;
  document.getElementById("btn-mail-close").innerHTML = ICON_CLOSE;
  document.getElementById("btn-mail-close").addEventListener("click", hideMail);
  document.getElementById("btn-mail-prev").innerHTML = ICON_CHEVRON_LEFT;
  document
    .getElementById("btn-mail-prev")
    .addEventListener("click", () => mailSlideOutAndIn(-1));
  document.getElementById("btn-mail-next").innerHTML = ICON_CHEVRON_RIGHT;
  document
    .getElementById("btn-mail-next")
    .addEventListener("click", () => mailSlideOutAndIn(1));
  document.getElementById("btn-mail-mark-read").innerHTML = ICON_MAIL_CHECK;
  document
    .getElementById("btn-mail-mark-read")
    .addEventListener("click", () => {
      mailMessages.forEach((m) => {
        m.read = true;
      });
      saveMailState();
      updateMailButton();
      renderMailPages();
    });
  document.getElementById("btn-mail-delete").innerHTML = ICON_MAIL_X;
  document.getElementById("btn-mail-delete-all").innerHTML = ICON_TRASH;
  document
    .getElementById("btn-mail-delete-all")
    .addEventListener("click", () => {
      mailMessages = [];
      localStorage.removeItem(MAIL_SAVE_KEY);
      mailPageIdx = 0;
      updateMailButton();
      renderMailPages();
    });
  document.getElementById("btn-mail-delete").addEventListener("click", () => {
    if (mailPageIdx === 0 || mailMessages.length === 0) return;
    const msgIdx = mailMessages.length - mailPageIdx;
    mailMessages.splice(msgIdx, 1);
    saveMailState();
    if (mailMessages.length === 0) {
      mailPageIdx = 0;
    } else {
      mailPageIdx = Math.max(1, Math.min(mailPageIdx, mailMessages.length));
    }
    renderMailPages();
  });
  mailPageIdx = 0;
  renderMailPages();
}
function hideMail() {
  mailOverlay.classList.add("hidden");
  mailAnimating = false;
}
document.getElementById("btn-mail").addEventListener("click", () => {
  if (!mailOverlay.classList.contains("hidden")) {
    hideMail();
    return;
  }
  closeAllOverlays();
  renderMail();
  mailOverlay.classList.remove("hidden");
});
mailOverlay.addEventListener("click", (e) => {
  if (e.target === mailOverlay) {
    hideMail();
  }
});
function mailCanNavigate(dir) {
  const btn = document.getElementById(
    dir > 0 ? "btn-mail-next" : "btn-mail-prev",
  );
  return btn && !btn.disabled;
}
function mailSlideBack() {
  const slider = document.getElementById("mail-slider");
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
let mailSwipeStartX = 0;
let mailSwipeActive = false;
const np = document.getElementById("mail-panel");
function startMailDrag(clientX) {
  if (mailAnimating) return false;
  mailSwipeStartX = clientX;
  mailSwipeActive = true;
  const slider = document.getElementById("mail-slider");
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveMailDrag(clientX) {
  if (!mailSwipeActive) return;
  const slider = document.getElementById("mail-slider");
  if (!slider) return;
  const dx = clientX - mailSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function endMailDrag(clientX) {
  if (!mailSwipeActive) return;
  mailSwipeActive = false;
  const dx = clientX - mailSwipeStartX;
  const w = document.getElementById("mail-panel").clientWidth;
  if (Math.abs(dx) > w * 0.25) {
    const dir = dx > 0 ? -1 : 1;
    if (mailCanNavigate(dir)) {
      mailSlideOutAndIn(dir);
    } else {
      mailSlideBack();
    }
  } else {
    mailSlideBack();
  }
}
np.addEventListener(
  "touchstart",
  (e) => {
    startMailDrag(e.touches[0].clientX);
  },
  { passive: true },
);
np.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      mailSwipeActive = false;
      return;
    }
    moveMailDrag(e.touches[0].clientX);
  },
  { passive: true },
);
np.addEventListener("touchend", (e) => {
  endMailDrag(e.changedTouches[0].clientX);
});
np.addEventListener("touchcancel", () => {
  mailSwipeActive = false;
  mailSlideBack();
});
np.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("button")) return;
  startMailDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveMailDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endMailDrag(e.clientX);
});
loadMailState();
updateMailButton();
