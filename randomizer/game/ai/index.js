(function (root, factory) {
  "use strict";

  const api = factory(root.SetiAIEvaluator, root.SetiAIPolicy);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAI = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (evaluator, policy) {
  "use strict";

  return Object.freeze({
    evaluator,
    policy,
  });
});
