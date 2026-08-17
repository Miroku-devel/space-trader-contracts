// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

let bankPageIdx = 0;
let bankAnimating = false;
let loanDebt = 0;
let playerHasInsurance = false;
let noClaim = 0;
let debt75kWarningSent = false;
const BANK_PAGES = 3;
function repayAmount(amount) {
  amount = Math.min(amount, loanDebt, playerCredits);
  if (amount <= 0) return;
  playerCredits -= amount;
  loanDebt -= amount;
  const wasFullyPaid = loanDebt <= 0;
  if (loanDebt < 0) loanDebt = 0;
  if (loanDebt < 75000) debt75kWarningSent = false;
  if (wasFullyPaid) {
    addMailMessage("Bank Paid", "Your loan has been fully repaid with the Bank of " + currentStar.name + ". Thank you for your business.");
  }
  saveTradeState();
  updateGameDate();
  renderBankPages();
  document.getElementById("bank-repay-overlay").classList.add("hidden");
}
function checkDebtWarning() {
  if (
    typeof loanDebt !== "undefined" &&
    loanDebt >= 75000 &&
    !debt75kWarningSent &&
    typeof addMailMessage === "function"
  ) {
    debt75kWarningSent = true;
    addMailMessage("Debt Warning", "Your debt has reached " + loanDebt.toLocaleString() + " cr. Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!");
  }
}
function netWorth() {
  const credits = typeof playerCredits !== "undefined" ? playerCredits : 0;
  const shipVal =
    typeof shipValuationForInsurance === "function"
      ? shipValuationForInsurance(true)
      : 0;
  const cargoVal = typeof cargoValuation === "function" ? cargoValuation() : 0;
  const debt = typeof loanDebt !== "undefined" ? loanDebt : 0;
  return credits + shipVal + cargoVal - debt;
}
function maxLoan() {
  const score =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  if (score < 0) return 500;
  let cargoValue = 0;
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    typeof playerCargo !== "undefined" &&
    currentStar
  ) {
    for (const item of TRADE_ITEMS) {
      const qty = playerCargo[item.id] || 0;
      if (qty > 0) {
        const price =
          typeof getItemSellPrice === "function"
            ? getItemSellPrice(item, currentStar)
            : getItemPrice(item, currentStar);
        cargoValue += price * qty;
      }
    }
  }
  const credits = typeof playerCredits !== "undefined" ? playerCredits : 0;
  const netWorth = credits + cargoValue - loanDebt;
  return Math.max(500, Math.floor(Math.max(0, netWorth) / 10 / 500) * 500);
}
function borrowable() {
  return Math.max(0, maxLoan() - loanDebt);
}
function goToBankPage(targetIdx) {
  if (
    bankAnimating ||
    targetIdx < 0 ||
    targetIdx >= BANK_PAGES ||
    targetIdx === bankPageIdx
  )
    return;
  const dir = targetIdx > bankPageIdx ? 1 : -1;
  const steps = Math.abs(targetIdx - bankPageIdx);
  const slider = document.getElementById("bank-slider");
  if (!slider) return;
  const w = document.getElementById("bank-content").clientWidth;
  const outX = -dir * w * steps;
  bankAnimating = true;
  slider.style.transition = "transform 0.3s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    bankPageIdx = targetIdx;
    renderBankPages();
    const newSlider = document.getElementById("bank-slider");
    if (!newSlider) {
      bankAnimating = false;
      return;
    }
    const inX = -outX;
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${inX}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.3s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      bankAnimating = false;
    });
  });
}
function bankSlideOutAndIn(dir) {
  goToBankPage(bankPageIdx + dir);
}
function insuranceShipValue() {
  if (typeof shipValuationForInsurance === "function")
    return shipValuationForInsurance(true);
  if (typeof shipTradeInValue === "function") return shipTradeInValue();
  return 0;
}
function insurancePrice() {
  const shipVal = insuranceShipValue();
  const discount = Math.min(noClaim, 90);
  return Math.max(
    1,
    Math.floor((Math.floor((shipVal * 5) / 2000) * (100 - discount)) / 100),
  );
}
function renderBankPages() {
  const debtRow =
    typeof loanDebt !== "undefined" && loanDebt > 0
      ? `<div class="bank-info-row"><span>Loan Debt:</span><span class="c-debt">-${loanDebt.toLocaleString()} cr</span></div>`
      : "";
  const blocked =
    typeof cantAffordInsurance === "function" && cantAffordInsurance();
  const warningBlock = blocked
    ? `<div class="bank-info mt8"><div class="bank-info-row c-red">You can't leave if you haven't paid your insurance. If you have no way to pay, you should stop your insurance at the bank.</div></div>`
    : "";
  const debtBlocked = typeof loanDebt !== "undefined" && loanDebt >= 100000;
  const debtWarningBlock = debtBlocked
    ? `<div class="bank-info mt8"><div class="bank-info-row c-red">Your debt is too large.<br>You are not allowed to leave this system until your debt is lowered.</div></div>`
    : "";
  const moonAds = [
    "Prime real estate in the stars!",
    "Own a piece of the cosmos!",
    "Your private paradise awaits!",
    "Limited time offer!",
    "The perfect getaway!",
    "Live among the stars!",
    "An investment that is out of this world!",
    "Your dream home among the stars!",
  ];
  const moonBlock =
    currentStar && currentStar.planetClass === "Habitable Moon"
      ? currentStar.owned
        ? `<div class="bank-info mt8"><div class="bank-info-row"><span>${currentStar.name} <span class="moon-check">${ICON_CHECK}</span></span><span>500,000 cr</span></div><div class="bank-info-row bank-ad-row"><span>${moonAds[Math.floor(Math.random() * moonAds.length)]}</span></div><div class="moon-btn-row"><button id="btn-bank-buy-moon" class="btn-moon-buy" disabled>Buy</button><button id="btn-bank-retreat-moon" class="btn-moon-retreat">Retreat</button></div></div>`
        : `<div class="bank-info mt8"><div class="bank-info-row"><span>${currentStar.name}</span><span>500,000 cr</span></div><div class="bank-info-row bank-ad-row"><span>${moonAds[Math.floor(Math.random() * moonAds.length)]}</span></div><div class="moon-btn-row"><button id="btn-bank-buy-moon" class="btn-moon-buy"${playerCredits < 500000 ? " disabled" : ""}>Buy</button><button id="btn-bank-retreat-moon" class="btn-moon-retreat"${currentStar.owned ? "" : " disabled"}>Retreat</button></div></div>`
      : "";
  const ba = borrowable();
  const shipVal = insuranceShipValue();
  const discount = Math.min(noClaim, 90);
  const insCost = insurancePrice();
  const insStatus = playerHasInsurance
    ? '<span class="ins-status">Insured</span>'
    : '<span class="ins-status no">Not Insured</span>';
  const insBtnText = playerHasInsurance
    ? "Cancel Insurance Policy"
    : "Buy Insurance Policy";
  const pages = [
    `<div class="bank-page"><div class="bank-info"><div class="bank-info-row"><span>Available Credits:</span><span>${(typeof playerCredits !== "undefined" ? playerCredits : 0).toLocaleString()} cr</span></div>${debtRow}</div>${warningBlock}${debtWarningBlock}${moonBlock}</div>`,
    `<div class="bank-page"><div class="bank-info"><div class="bank-info-row"><span>Available Credits:</span><span>${(typeof playerCredits !== "undefined" ? playerCredits : 0).toLocaleString()} cr</span></div>${debtRow}</div></div><div class="bank-loan-form"><label for="bank-loan-input"><span>Amount: <span id="bank-loan-amount">0</span> cr</span><span>Max: ${ba.toLocaleString()} cr &middot; 10% interest/warp</span></label><div class="bank-loan-controls"><input type="range" id="bank-loan-input" min="0" max="${ba}" value="0"${ba <= 0 ? " disabled" : ""} /><button id="btn-bank-do-loan-50"${ba <= 0 ? " disabled" : ""}>50%</button><button id="btn-bank-do-loan-max"${ba <= 0 ? " disabled" : ""}>Max</button><button id="btn-bank-do-loan-repay"${typeof loanDebt !== "undefined" && (loanDebt <= 0 || playerCredits <= 0) ? " disabled" : ""}>Repay</button><button id="btn-bank-do-loan"${ba <= 0 ? " disabled" : ""}>Borrow</button></div></div></div>`,
    `<div class="bank-page"><div class="bank-info"><div class="bank-info-row"><span>Available Credits:</span><span>${(typeof playerCredits !== "undefined" ? playerCredits : 0).toLocaleString()} cr</span></div>${debtRow}</div><div class="bank-info mt8"><div class="bank-info-row"><span>Ship Value:</span><span>${shipVal.toLocaleString()} cr</span></div><div class="bank-info-row"><span>Safe Pilot Discount:</span><span>${discount} cr</span></div><div class="bank-info-row"><span>Cost:</span><span>${insCost.toLocaleString()} cr/warp</span></div><div class="bank-info-row"><span>Status:</span><span>${insStatus}</span></div></div><button id="btn-bank-insurance" class="${playerHasInsurance ? "cancel" : ""}"${!playerHasInsurance && !hasEscapePod ? " disabled" : ""}>${insBtnText}</button></div>`,
  ];
  document.getElementById("bank-slider").innerHTML = pages[bankPageIdx];
  if (bankPageIdx === 1) {
    const rangeInput = document.getElementById("bank-loan-input");
    const amountDisplay = document.getElementById("bank-loan-amount");
    const borrowBtn = document.getElementById("btn-bank-do-loan");
    if (rangeInput && amountDisplay) {
      rangeInput.addEventListener("input", () => {
        amountDisplay.textContent = rangeInput.value;
        if (borrowBtn) borrowBtn.disabled = parseInt(rangeInput.value, 10) <= 0;
      });
    }
    if (borrowBtn) borrowBtn.disabled = parseInt(rangeInput.value, 10) <= 0;
    const maxBtn = document.getElementById("btn-bank-do-loan-max");
    if (maxBtn) {
      maxBtn.addEventListener("click", () => {
        const input = document.getElementById("bank-loan-input");
        const display = document.getElementById("bank-loan-amount");
        const ba = borrowable();
        if (input && display) {
          input.value = ba;
          display.textContent = ba.toString();
          input.dispatchEvent(new Event("input"));
        }
      });
    }
    const halfBtn = document.getElementById("btn-bank-do-loan-50");
    if (halfBtn) {
      halfBtn.addEventListener("click", () => {
        const input = document.getElementById("bank-loan-input");
        const display = document.getElementById("bank-loan-amount");
        const ba = borrowable();
        const half = Math.floor(ba / 2);
        if (input && display) {
          input.value = half;
          display.textContent = half.toString();
          input.dispatchEvent(new Event("input"));
        }
      });
    }
    const repayBtn = document.getElementById("btn-bank-do-loan-repay");
    if (repayBtn) {
      repayBtn.addEventListener("click", showRepayPopup);
    }
    if (borrowBtn) {
      borrowBtn.addEventListener("click", () => {
        const input = document.getElementById("bank-loan-input");
        if (!input) return;
        let amount = parseInt(input.value, 10);
        if (isNaN(amount) || amount <= 0) return;
        amount = Math.min(amount, borrowable());
        if (amount <= 0) return;
        loanDebt += amount;
        playerCredits += amount;
        checkDebtWarning();
        addMailMessage("Bank Loan", "Loan of " + amount.toLocaleString() + " cr approved by the Bank of " + currentStar.name + ". Debt: " + loanDebt.toLocaleString() + " cr (10% interest per warp). <span class=\"c-red\">If your debt reaches 100,000 cr, you will be blocked from purchasing equipment, ships, and traveling.</span>");
        saveTradeState();
        updateGameDate();
        renderBankPages();
        const locEl = document.getElementById("bank-location");
        if (locEl)
          locEl.textContent = `Welcome to the Bank of ${currentStar ? currentStar.name : "Unknown"}`;
      });
    }
  }
  if (bankPageIdx === 2) {
    const insBtn = document.getElementById("btn-bank-insurance");
    if (insBtn) {
      insBtn.addEventListener("click", () => {
        if (playerHasInsurance) {
          playerHasInsurance = false;
          noClaim = 0;
          addMailMessage("Insurance Policy", "Insurance policy cancelled. Your safe-pilot discount has been reset to 0.");
        } else {
          playerHasInsurance = true;
          addMailMessage("Insurance Policy", "Insurance policy purchased. Cost: " + insurancePrice().toLocaleString() + " cr/warp. Your ship is now covered in case of destruction.");
        }
        saveTradeState();
        renderBankPages();
        updateBankBlink();
      });
    }
  }
  const prevBtn = document.getElementById("btn-bank-prev");
  const nextBtn = document.getElementById("btn-bank-next");
  if (prevBtn) prevBtn.disabled = bankPageIdx === 0;
  if (nextBtn) nextBtn.disabled = bankPageIdx === BANK_PAGES - 1;
  const titleEl = document.getElementById("bank-title");
  if (titleEl) {
    const titles = ["Bank", "Bank: Loan", "Bank: Insurance"];
    titleEl.textContent = titles[bankPageIdx] || "Bank";
  }
  const homeBtn = document.getElementById("btn-bank-home");
  const loanBtn = document.getElementById("btn-bank-loan");
  const insBtnSide = document.getElementById("btn-bank-ins");
  if (homeBtn) homeBtn.disabled = bankPageIdx === 0;
  if (loanBtn) loanBtn.disabled = bankPageIdx === 1;
  if (insBtnSide) insBtnSide.disabled = bankPageIdx === 2;
  const buyMoonBtn = document.getElementById("btn-bank-buy-moon");
  if (buyMoonBtn) {
    buyMoonBtn.addEventListener("click", () => {
      if (playerCredits < 500000) return;
      playerCredits -= 500000;
      currentStar.owned = true;
      if (typeof saveTradeState === "function") saveTradeState();
      saveState();
      updateBankBlink();
      renderBankPages();
    });
  }
  const retreatMoonBtn = document.getElementById("btn-bank-retreat-moon");
  if (retreatMoonBtn) {
    retreatMoonBtn.addEventListener("click", () => {
      hideBank();
      if (typeof showRetirement === "function") showRetirement();
    });
  }
}
function showRepayPopup() {
  if (loanDebt <= 0 || playerCredits <= 0) return;
  const max = Math.min(loanDebt, playerCredits);
  const body = document.getElementById("bank-repay-body");
  body.innerHTML = `
        <div class="bank-repay-info">
            Debt: <span class="repay-amount">${loanDebt.toLocaleString()} cr</span> &middot;
            Credits: <span class="repay-amount">${playerCredits.toLocaleString()} cr</span>
        </div>
        <div class="qty-slider-row">
            <input type="range" class="qty-slider" min="0" max="${max}" value="0" step="1">
        </div>
        <div class="qty-total">Repay: <span class="qty-total-val">0</span>&nbsp;cr</div>
        <div class="qty-btns">
            <button class="qty-btn cancel">Cancel</button>
            <button class="qty-btn max">Max</button>
            <button class="qty-btn confirm">Repay</button>
        </div>
    `;
  const slider = body.querySelector(".qty-slider");
  const totalSpan = body.querySelector(".qty-total-val");
  function updateDisplay() {
    const v = parseInt(slider.value);
    totalSpan.textContent = v.toLocaleString();
  }
  slider.addEventListener("input", updateDisplay);
  body.querySelector(".qty-btn.max").addEventListener("click", () => {
    slider.value = slider.max;
    updateDisplay();
  });
  body.querySelector(".qty-btn.confirm").addEventListener("click", () => {
    repayAmount(parseInt(slider.value, 10));
  });
  body.querySelector(".qty-btn.cancel").addEventListener("click", () => {
    document.getElementById("bank-repay-overlay").classList.add("hidden");
  });
  document.getElementById("bank-repay-overlay").classList.remove("hidden");
}
function renderBank() {
  const sidebar = document.getElementById("bank-sidebar");
  sidebar.innerHTML = `<button id="btn-bank-home"></button><button id="btn-bank-loan"></button><button id="btn-bank-ins"></button>`;
  const homeBtn = document.getElementById("btn-bank-home");
  if (homeBtn) {
    homeBtn.innerHTML = ICON_LANDMARK;
    homeBtn.addEventListener("click", () => goToBankPage(0));
  }
  const loanBtn = document.getElementById("btn-bank-loan");
  if (loanBtn) {
    loanBtn.innerHTML = ICON_LOAN;
    loanBtn.addEventListener("click", () => goToBankPage(1));
  }
  const insBtn = document.getElementById("btn-bank-ins");
  if (insBtn) {
    insBtn.innerHTML = ICON_SHIELD;
    insBtn.addEventListener("click", () => goToBankPage(2));
  }
  document.getElementById("bank-content").innerHTML = `
        <div id="bank-header">
            <div id="bank-header-left">
                <span id="bank-title">Bank</span>
                <span id="bank-location">Welcome to the Bank of ${currentStar ? currentStar.name : "Unknown"}</span>
            </div>
            <div id="bank-header-right">
                <button id="btn-bank-close"></button>
            </div>
        </div>
        <div id="bank-slider"></div>`;
  document.getElementById("btn-bank-close").innerHTML = ICON_CLOSE;
  document.getElementById("btn-bank-close").addEventListener("click", hideBank);
  bankPageIdx = 0;
  renderBankPages();
}
function hideBank() {
  bankOverlay.classList.add("hidden");
  document.getElementById("bank-repay-overlay").classList.add("hidden");
  bankAnimating = false;
}
document.getElementById("btn-bank").addEventListener("click", () => {
  if (!bankOverlay.classList.contains("hidden")) {
    hideBank();
    return;
  }
  closeAllOverlays();
  renderBank();
  bankOverlay.classList.remove("hidden");
});
bankOverlay.addEventListener("click", (e) => {
  if (e.target === bankOverlay) {
    hideBank();
  }
});
document.getElementById("bank-repay-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("bank-repay-overlay")) {
    document.getElementById("bank-repay-overlay").classList.add("hidden");
  }
});
function bankCanNavigate(dir) {
  const btn = document.getElementById(
    dir > 0 ? "btn-bank-next" : "btn-bank-prev",
  );
  return btn && !btn.disabled;
}
function bankSlideBack() {
  const slider = document.getElementById("bank-slider");
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
let bankSwipeStartX = 0;
let bankSwipeActive = false;
const bp = document.getElementById("bank-panel");
function startBankDrag(clientX) {
  if (bankAnimating) return false;
  if (
    !document.getElementById("bank-repay-overlay").classList.contains("hidden")
  )
    return false;
  bankSwipeStartX = clientX;
  bankSwipeActive = true;
  const slider = document.getElementById("bank-slider");
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveBankDrag(clientX) {
  if (!bankSwipeActive) return;
  const slider = document.getElementById("bank-slider");
  if (!slider) return;
  const dx = clientX - bankSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function endBankDrag(clientX) {
  if (!bankSwipeActive) return;
  bankSwipeActive = false;
  const dx = clientX - bankSwipeStartX;
  const w = document.getElementById("bank-panel").clientWidth;
  if (Math.abs(dx) > w * 0.25) {
    const dir = dx > 0 ? -1 : 1;
    if (bankCanNavigate(dir)) {
      bankSlideOutAndIn(dir);
    } else {
      bankSlideBack();
    }
  } else {
    bankSlideBack();
  }
}
bp.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest("input")) return;
    startBankDrag(e.touches[0].clientX);
  },
  { passive: true },
);
bp.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      bankSwipeActive = false;
      return;
    }
    moveBankDrag(e.touches[0].clientX);
  },
  { passive: true },
);
bp.addEventListener("touchend", (e) => {
  endBankDrag(e.changedTouches[0].clientX);
});
bp.addEventListener("touchcancel", () => {
  bankSwipeActive = false;
  bankSlideBack();
});
bp.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("button")) return;
  if (e.target.closest("input")) return;
  startBankDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveBankDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endBankDrag(e.clientX);
});
function cantAffordInsurance() {
  if (
    typeof playerHasInsurance === "undefined" ||
    !playerHasInsurance ||
    typeof playerCredits === "undefined"
  )
    return false;
  const crewCost =
    typeof window.CREW_NAMES !== "undefined"
      ? window.CREW_NAMES.filter((c) => c.hired).reduce(
          (sum, c) => sum + (c.cost || 0),
          0,
        )
      : 0;
  return playerCredits < insurancePrice() + crewCost;
}
function debtIsTooLarge() {
  return typeof loanDebt !== "undefined" && loanDebt >= 100000;
}
function updateBankBlink() {
  var btn = document.getElementById("btn-bank");
  if (!btn) return;
  if (
    (typeof cantAffordInsurance === "function" && cantAffordInsurance()) ||
    (typeof loanDebt !== "undefined" && loanDebt >= 100000)
  ) {
    btn.classList.add("bank-blink");
  } else {
    btn.classList.remove("bank-blink");
  }
}
