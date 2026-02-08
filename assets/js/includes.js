(function () {
  const templateCache = new Map();

  async function fetchTemplate(path) {
    if (!templateCache.has(path)) {
      const request = fetch(path).then((response) => {
        if (!response.ok) {
          throw new Error("Include not found: " + path);
        }
        return response.text();
      });
      templateCache.set(path, request);
    }
    return templateCache.get(path);
  }

  function applyVars(template, vars) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : "";
    });
  }

  function datasetToVars(node) {
    const vars = {};
    Object.keys(node.dataset).forEach(function (key) {
      if (key !== "include") {
        vars[key] = node.dataset[key];
      }
    });
    return vars;
  }

  async function resolveIncludes() {
    let includeNodes = Array.from(document.querySelectorAll("[data-include]"));

    while (includeNodes.length > 0) {
      for (const node of includeNodes) {
        const includePath = node.getAttribute("data-include");
        if (!includePath) {
          continue;
        }

        try {
          const template = await fetchTemplate(includePath);
          const vars = datasetToVars(node);
          const html = applyVars(template, vars);
          const fragment = document.createRange().createContextualFragment(html);
          node.replaceWith(fragment);
        } catch (error) {
          console.error(error);
        }
      }

      includeNodes = Array.from(document.querySelectorAll("[data-include]"));
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    resolveIncludes();
  });
})();
