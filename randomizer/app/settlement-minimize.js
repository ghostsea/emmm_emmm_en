(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppSettlementMinimize = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  function getActiveClasses(surface) {
    return String(surface?.dataset?.settlementActiveClasses || "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function isSurfaceActive(surface, appWrap) {
    const activeClasses = getActiveClasses(surface);
    if (activeClasses.length) {
      return activeClasses.some((className) => appWrap?.classList?.contains(className));
    }
    return Boolean(surface && !surface.hidden);
  }

  function getSurfaceLabel(surface, documentRef) {
    const explicitLabel = String(surface?.dataset?.settlementLabel || "").trim();
    if (explicitLabel) return explicitLabel;

    const dialog = surface?.querySelector?.("[role=\"dialog\"]");
    const labelledBy = dialog?.getAttribute?.("aria-labelledby");
    const labelledNode = labelledBy ? documentRef?.getElementById?.(labelledBy) : null;
    const labelledText = String(labelledNode?.textContent || "").trim();
    if (labelledText) return labelledText;

    return String(surface?.getAttribute?.("aria-label") || "").trim() || "当前结算";
  }

  function createController(options = {}) {
    const documentRef = options.document || root.document;
    const appWrap = options.appWrap || documentRef?.getElementById?.("app-wrap");
    const resumeButton = options.resumeButton || documentRef?.getElementById?.("settlement-resume-button");
    const interactionShield = options.interactionShield
      || documentRef?.getElementById?.("settlement-interaction-shield");
    const surfaces = Array.from(documentRef?.querySelectorAll?.("[data-settlement-minimizable]") || []);

    if (!appWrap || !resumeButton || !interactionShield) {
      return null;
    }

    let minimized = null;
    let appWrapWasInert = Boolean(appWrap.inert);
    const triggerButtons = new Map();

    function syncTriggerButtons() {
      surfaces.forEach((surface) => {
        const button = triggerButtons.get(surface);
        if (!button) return;
        button.hidden = !isSurfaceActive(surface, appWrap) || minimized?.surface === surface;
      });

      if (minimized && !isSurfaceActive(minimized.surface, appWrap)) {
        restore({ focus: false });
      }
    }

    function restore({ focus = true } = {}) {
      if (!minimized) return false;

      const previous = minimized;
      minimized = null;
      previous.surface.classList.remove("is-settlement-minimized");
      if (previous.ariaHidden == null) {
        previous.surface.removeAttribute("aria-hidden");
      } else {
        previous.surface.setAttribute("aria-hidden", previous.ariaHidden);
      }

      appWrap.classList.remove("settlement-minimized");
      appWrap.inert = appWrapWasInert;
      if (appWrapWasInert) {
        appWrap.setAttribute("inert", "");
      } else {
        appWrap.removeAttribute("inert");
      }
      interactionShield.hidden = true;
      interactionShield.setAttribute("aria-hidden", "true");
      resumeButton.hidden = true;
      resumeButton.textContent = "继续结算";
      syncTriggerButtons();

      if (focus && previous.trigger?.isConnected !== false) {
        previous.trigger?.focus?.();
      }
      return true;
    }

    function minimize(surface, trigger) {
      if (minimized || !isSurfaceActive(surface, appWrap)) return false;

      appWrapWasInert = Boolean(appWrap.inert);
      minimized = {
        surface,
        trigger,
        ariaHidden: surface.getAttribute("aria-hidden"),
      };
      const label = getSurfaceLabel(surface, documentRef);

      surface.classList.add("is-settlement-minimized");
      surface.setAttribute("aria-hidden", "true");
      appWrap.classList.add("settlement-minimized");
      appWrap.inert = true;
      appWrap.setAttribute("inert", "");
      interactionShield.hidden = false;
      interactionShield.setAttribute("aria-hidden", "false");
      resumeButton.textContent = `继续结算 · ${label}`;
      resumeButton.hidden = false;
      syncTriggerButtons();
      resumeButton.focus();
      return true;
    }

    surfaces.forEach((surface) => {
      const host = surface.querySelector("[data-settlement-minimize-host]")
        || surface.querySelector("[role=\"dialog\"]");
      if (!host) return;

      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "settlement-minimize-button";
      button.textContent = "−";
      button.title = "最小化结算窗口";
      button.setAttribute("aria-label", "最小化结算窗口");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        minimize(surface, button);
      });
      host.append(button);
      triggerButtons.set(surface, button);
    });

    resumeButton.addEventListener("click", () => restore());

    const MutationObserverCtor = options.MutationObserver || root.MutationObserver;
    const observer = typeof MutationObserverCtor === "function"
      ? new MutationObserverCtor(syncTriggerButtons)
      : null;
    observer?.observe(appWrap, { attributes: true, attributeFilter: ["class"] });
    surfaces.forEach((surface) => {
      observer?.observe(surface, { attributes: true, attributeFilter: ["hidden"] });
    });

    syncTriggerButtons();

    return {
      minimizeByKey(key) {
        const surface = surfaces.find((candidate) => candidate.dataset.settlementMinimizable === key);
        return surface ? minimize(surface, triggerButtons.get(surface)) : false;
      },
      restore,
      reset() {
        restore({ focus: false });
        syncTriggerButtons();
      },
      isMinimized() {
        return Boolean(minimized);
      },
      destroy() {
        restore({ focus: false });
        observer?.disconnect();
      },
    };
  }

  return {
    createController,
    getActiveClasses,
    getSurfaceLabel,
    isSurfaceActive,
  };
});
