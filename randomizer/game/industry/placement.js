(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryPlacement = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const INDUSTRY_REFERENCE_SIZE = Object.freeze({ width: 2372, height: 1792 });

  /**
   * 公司牌左下角「1x」免费/快速行动圆标位置（相对牌面宽高的百分比）。
   * 异星实验室、未来跨度研究所暂不处理 1x 行动，不返回可点击布局。
   * 坐标经各牌资产手工校准。
   */
  const INDUSTRY_ACTION_MARKER_SLOTS = Object.freeze({
    "层云核心": Object.freeze({ percentX: 8.01, percentY: 74.2, radiusPercent: 4.9 }),
    "任务中继站": Object.freeze({ percentX: 8.01, percentY: 77.5, radiusPercent: 4.9 }),
    "哨兵探测网络": Object.freeze({ percentX: 10.01, percentY: 74.8, radiusPercent: 4.9 }),
    "图灵系统": Object.freeze({ percentX: 9.01, percentY: 80.3, radiusPercent: 4.9 }),
    "宇宙战略集团": Object.freeze({ percentX: 9.01, percentY: 77.2, radiusPercent: 4.9 }),
    "寰宇动力": Object.freeze({ percentX: 9.01, percentY: 78.3, radiusPercent: 4.9 }),
    "芬威克研究中心": Object.freeze({ percentX: 10.01, percentY: 76.5, radiusPercent: 4.9 }),
    "深空探测": Object.freeze({ percentX: 8.01, percentY: 76.0, radiusPercent: 4.9 }),
    "赫利昂联合体": Object.freeze({ percentX: 10.01, percentY: 60.0, radiusPercent: 4.9 }),
    "未来跨度研究所": Object.freeze({ percentX: 11.2, percentY: 84.0, radiusPercent: 4.9 }),
  });

  const EXCLUDED_INDUSTRY_LABELS = Object.freeze(["异星实验室", "未来跨度研究所"]);

  function normalizeIndustryLabel(cardOrLabel) {
    const label = typeof cardOrLabel === "string"
      ? cardOrLabel
      : (cardOrLabel?.label || cardOrLabel?.id || cardOrLabel?.src || "");
    return String(label || "")
      .replace(/^industry:/, "")
      .replace(/^.*[\\/]/, "")
      .replace(/\.[^.]+$/, "");
  }

  function hasIndustryActionMarker(cardOrLabel) {
    const label = normalizeIndustryLabel(cardOrLabel);
    if (!label || EXCLUDED_INDUSTRY_LABELS.includes(label)) return false;
    return Boolean(INDUSTRY_ACTION_MARKER_SLOTS[label]);
  }

  function getIndustryActionMarkerLayout(cardOrLabel) {
    const label = normalizeIndustryLabel(cardOrLabel);
    if (!label || EXCLUDED_INDUSTRY_LABELS.includes(label)) return null;
    return INDUSTRY_ACTION_MARKER_SLOTS[label] || null;
  }

  return Object.freeze({
    INDUSTRY_REFERENCE_SIZE,
    INDUSTRY_ACTION_MARKER_SLOTS,
    EXCLUDED_INDUSTRY_LABELS,
    normalizeIndustryLabel,
    hasIndustryActionMarker,
    getIndustryActionMarkerLayout,
  });
});
