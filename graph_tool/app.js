(function () {
  "use strict";

  const DEFAULT_STATE = {
    images: [],
    selectedId: null,
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 0) => Number(value.toFixed(digits));
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  function create(root, options = {}) {
    if (!root) {
      throw new Error("GraphTool.create(root) requires a root element.");
    }

    const state = structuredCloneSafe(options.initialState || DEFAULT_STATE);
    state.images = Array.isArray(state.images) ? state.images : [];
    state.selectedId = state.images.some((img) => img.id === state.selectedId) ? state.selectedId : null;

    let dragState = null;

    root.innerHTML = `
      <main class="graph-tool" aria-label="Graph Tool">
        <section class="workspace" data-role="workspace" tabindex="0" aria-label="图片画布">
          <div class="empty-state" data-role="empty-state">
            <div>
              <strong>Graph Tool</strong>
              <span>本地图片布局工具</span>
            </div>
          </div>
        </section>
        <aside class="side-panel">
          <header class="panel-header">
            <div class="panel-title">
              <h1>Graph Tool</h1>
              <p data-role="counter">0 个图层</p>
            </div>
            <button class="button small danger" type="button" data-action="clear">清空</button>
          </header>
          <div class="panel-body">
            <section class="section">
              <h2 class="section-title">图片</h2>
              <div class="upload-row">
                <label class="file-button">
                  <input class="file-input" type="file" data-role="image-input" accept="image/*" multiple>
                  上传图片
                </label>
                <label class="file-button">
                  <input class="file-input" type="file" data-role="layout-input" accept="application/json,.json">
                  导入布局
                </label>
              </div>
              <div class="status-line" data-role="status"></div>
            </section>
            <section class="section" data-role="properties-section">
              <h2 class="section-title">属性</h2>
              <div data-role="properties"></div>
            </section>
            <section class="section">
              <h2 class="section-title">图层</h2>
              <div class="layer-list" data-role="layer-list"></div>
            </section>
          </div>
          <footer class="panel-footer">
            <button class="button primary" type="button" data-action="export-json">保存 JSON</button>
            <button class="button" type="button" data-action="export-png">导出 PNG</button>
          </footer>
        </aside>
      </main>
    `;

    const els = {
      workspace: root.querySelector('[data-role="workspace"]'),
      emptyState: root.querySelector('[data-role="empty-state"]'),
      imageInput: root.querySelector('[data-role="image-input"]'),
      layoutInput: root.querySelector('[data-role="layout-input"]'),
      properties: root.querySelector('[data-role="properties"]'),
      layerList: root.querySelector('[data-role="layer-list"]'),
      status: root.querySelector('[data-role="status"]'),
      counter: root.querySelector('[data-role="counter"]'),
    };

    function render() {
      renderStage();
      renderProperties();
      renderLayers();
      updateButtons();
    }

    function renderStage() {
      const currentItems = new Set(state.images.map((img) => img.id));
      for (const item of Array.from(els.workspace.querySelectorAll(".stage-item"))) {
        if (!currentItems.has(item.dataset.id)) {
          item.remove();
        }
      }

      state.images.forEach((img, index) => {
        let item = els.workspace.querySelector(`.stage-item[data-id="${cssEscape(img.id)}"]`);
        if (!item) {
          item = document.createElement("div");
          item.className = "stage-item";
          item.dataset.id = img.id;
          item.innerHTML = `<img class="stage-image" alt="">`;
          item.addEventListener("pointerdown", (event) => onPointerDown(event, img.id));
          item.addEventListener("wheel", (event) => onWheel(event, img.id), { passive: false });
          els.workspace.appendChild(item);
        }

        const imageEl = item.querySelector("img");
        imageEl.src = img.src;
        imageEl.alt = img.name || "image";
        item.classList.toggle("is-selected", img.id === state.selectedId);
        item.style.transform = `translate(${img.x}px, ${img.y}px) scale(${img.scale}) rotate(${img.rotation}deg)`;
        item.style.zIndex = String(index + 1);
      });

      els.emptyState.style.display = state.images.length ? "none" : "grid";
      els.counter.textContent = `${state.images.length} 个图层`;
    }

    function renderProperties() {
      const img = getSelectedImage();
      if (!img) {
        els.properties.innerHTML = `<div class="hint">未选择图层</div>`;
        return;
      }

      els.properties.innerHTML = `
        <div class="property-box">
          <div class="selected-name">
            <strong title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</strong>
            <button class="button small danger" type="button" data-action="delete-selected">删除</button>
          </div>
          ${rangeField("x", "X", img.x, -2000, 3000, 1, "px")}
          ${rangeField("y", "Y", img.y, -2000, 3000, 1, "px")}
          ${rangeField("scale", "缩放", img.scale, 0.05, 5, 0.01, "x")}
          ${rangeField("rotation", "旋转", img.rotation, -180, 180, 1, "°")}
          <div class="field">
            <div class="field-label"><span>微调</span><span class="field-value">10 px</span></div>
            <div class="nudge-grid">
              <span class="spacer"></span>
              <button class="button small" type="button" data-nudge="0,-10">上</button>
              <span class="spacer"></span>
              <button class="button small" type="button" data-nudge="-10,0">左</button>
              <button class="button small" type="button" data-action="center-selected">居中</button>
              <button class="button small" type="button" data-nudge="10,0">右</button>
              <span class="spacer"></span>
              <button class="button small" type="button" data-nudge="0,10">下</button>
              <span class="spacer"></span>
            </div>
          </div>
        </div>
      `;
    }

    function renderLayers() {
      if (!state.images.length) {
        els.layerList.innerHTML = `<div class="hint">暂无图层</div>`;
        return;
      }

      els.layerList.innerHTML = state.images
        .map((img, index) => `
          <div class="layer-item ${img.id === state.selectedId ? "is-active" : ""}" data-layer-id="${escapeHtml(img.id)}">
            <div class="layer-thumb"><img src="${escapeHtml(img.src)}" alt=""></div>
            <div>
              <div class="layer-name" title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</div>
              <div class="layer-meta">x ${round(img.x)} / y ${round(img.y)} / ${round(img.scale, 2)}x</div>
            </div>
            <div class="layer-actions">
              <button class="button small" type="button" data-layer-move-id="${escapeHtml(img.id)}" data-layer-move-direction="up" ${index === state.images.length - 1 ? "disabled" : ""}>上移</button>
              <button class="button small" type="button" data-layer-move-id="${escapeHtml(img.id)}" data-layer-move-direction="down" ${index === 0 ? "disabled" : ""}>下移</button>
            </div>
          </div>
        `)
        .join("");
    }

    function updateButtons() {
      root.querySelector('[data-action="clear"]').disabled = state.images.length === 0;
      root.querySelector('[data-action="export-json"]').disabled = state.images.length === 0;
      root.querySelector('[data-action="export-png"]').disabled = state.images.length === 0;
    }

    function rangeField(key, label, value, min, max, step, unit) {
      const display = key === "scale" ? round(value, 2) : round(value);
      return `
        <label class="field">
          <span class="field-label">
            <span>${label}</span>
            <span class="field-value" data-value-field="${key}">${display}${unit}</span>
          </span>
          <span class="range-line">
            <input type="range" data-field="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
            <input type="number" data-field="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
          </span>
        </label>
      `;
    }

    function getSelectedImage() {
      return state.images.find((img) => img.id === state.selectedId) || null;
    }

    function select(id) {
      state.selectedId = state.images.some((img) => img.id === id) ? id : null;
      render();
    }

    function patchSelected(patch) {
      if (!state.selectedId) return;
      state.images = state.images.map((img) => (img.id === state.selectedId ? { ...img, ...patch } : img));
    }

    function updateSelected(patch) {
      patchSelected(patch);
      render();
    }

    function syncPropertyFields() {
      const img = getSelectedImage();
      if (!img) return;
      const units = { x: "px", y: "px", scale: "x", rotation: "°" };
      for (const key of ["x", "y", "scale", "rotation"]) {
        const value = img[key];
        const display = key === "scale" ? round(value, 2) : round(value);
        root.querySelectorAll(`[data-field="${key}"]`).forEach((field) => {
          if (document.activeElement !== field) {
            field.value = value;
          }
        });
        const valueEl = root.querySelector(`[data-value-field="${key}"]`);
        if (valueEl) valueEl.textContent = `${display}${units[key]}`;
      }
    }

    function deleteImage(id) {
      const deletedIndex = state.images.findIndex((img) => img.id === id);
      state.images = state.images.filter((img) => img.id !== id);
      if (state.selectedId === id) {
        state.selectedId = state.images[Math.min(deletedIndex, state.images.length - 1)]?.id || null;
      }
      render();
      setStatus("已删除图层");
    }

    function clearAll() {
      state.images = [];
      state.selectedId = null;
      render();
      setStatus("已清空");
    }

    function centerSelected() {
      const img = getSelectedImage();
      if (!img) return;
      const rect = els.workspace.getBoundingClientRect();
      updateSelected({
        x: Math.round(rect.width / 2 - imageNaturalWidth(img) * img.scale / 2),
        y: Math.round(rect.height / 2 - imageNaturalHeight(img) * img.scale / 2),
      });
    }

    function moveLayer(id, direction) {
      const index = state.images.findIndex((img) => img.id === id);
      if (index < 0) return;
      const nextIndex = direction === "up" ? index + 1 : index - 1;
      if (nextIndex < 0 || nextIndex >= state.images.length) return;
      const copy = state.images.slice();
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      state.images = copy;
      render();
    }

    function addFiles(files) {
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (!imageFiles.length) {
        setStatus("未找到图片文件");
        return;
      }

      Promise.all(imageFiles.map(readImageFile)).then((newImages) => {
        const rect = els.workspace.getBoundingClientRect();
        const baseX = Math.max(32, Math.round(rect.width / 2 - 160));
        const baseY = Math.max(32, Math.round(rect.height / 2 - 120));
        const placedImages = newImages.map((img, index) => ({
          ...img,
          x: baseX + index * 28,
          y: baseY + index * 28,
        }));

        state.images = state.images.concat(placedImages);
        state.selectedId = placedImages[placedImages.length - 1].id;
        render();
        setStatus(`已添加 ${placedImages.length} 张图片`);
      }).catch((error) => {
        console.error(error);
        setStatus("图片读取失败");
      });
    }

    function readImageFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => {
          const probe = new Image();
          probe.onload = () => resolve({
            id: uid(),
            name: file.name,
            src: String(reader.result),
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            naturalWidth: probe.naturalWidth,
            naturalHeight: probe.naturalHeight,
          });
          probe.onerror = reject;
          probe.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }

    function importLayout(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onerror = () => setStatus("布局读取失败");
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const images = Array.isArray(parsed) ? parsed : parsed.images;
          if (!Array.isArray(images)) {
            throw new Error("Invalid layout");
          }

          if (images.some((img) => img && img.src)) {
            state.images = images
              .filter((img) => img && img.src)
              .map((img) => ({
                id: img.id || uid(),
                name: img.name || "image",
                src: img.src,
                x: Number(img.x) || 0,
                y: Number(img.y) || 0,
                scale: Number(img.scale) || 1,
                rotation: Number(img.rotation) || 0,
                naturalWidth: Number(img.naturalWidth) || 0,
                naturalHeight: Number(img.naturalHeight) || 0,
              }));
          } else {
            applyLayoutParams(images);
          }
          state.selectedId = state.images.at(-1)?.id || null;
          render();
          setStatus(`已导入 ${images.length} 条布局参数`);
        } catch (error) {
          console.error(error);
          setStatus("布局格式不正确");
        }
      };
      reader.readAsText(file);
    }

    function applyLayoutParams(layoutItems) {
      const queuesByName = new Map();
      for (const item of layoutItems) {
        if (!item || !item.name) continue;
        const key = String(item.name);
        const queue = queuesByName.get(key) || [];
        queue.push(item);
        queuesByName.set(key, queue);
      }

      state.images = state.images.map((img) => {
        const queue = queuesByName.get(img.name);
        const next = queue?.shift();
        if (!next) return img;
        return {
          ...img,
          x: Number(next.x) || 0,
          y: Number(next.y) || 0,
          scale: Number(next.scale) || 1,
          rotation: Number(next.rotation) || 0,
        };
      });
    }

    function exportJson() {
      if (!state.images.length) return;
      const payload = state.images.map((img) => ({
        name: img.name,
        x: round(img.x),
        y: round(img.y),
        scale: round(img.scale, 3),
        rotation: round(img.rotation, 2),
      }));
      downloadBlob(JSON.stringify(payload, null, 2), "scene_layout.json", "application/json");
      setStatus("已保存 JSON");
    }

    async function exportPng() {
      if (!state.images.length) return;
      const rect = els.workspace.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
      const ctx = canvas.getContext("2d");
      drawGrid(ctx, canvas.width, canvas.height);

      for (const img of state.images) {
        const image = await loadImage(img.src);
        const width = image.naturalWidth || img.naturalWidth || image.width;
        const height = image.naturalHeight || img.naturalHeight || image.height;
        ctx.save();
        ctx.translate(img.x, img.y);
        ctx.scale(img.scale, img.scale);
        ctx.rotate(img.rotation * Math.PI / 180);
        ctx.drawImage(image, 0, 0, width, height);
        ctx.restore();
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus("PNG 导出失败");
          return;
        }
        downloadBlob(blob, "graph_tool_scene.png", "image/png");
        setStatus("已导出 PNG");
      });
    }

    function drawGrid(ctx, width, height) {
      ctx.fillStyle = "#131924";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 24) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += 24) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
    }

    function onPointerDown(event, id) {
      const img = state.images.find((item) => item.id === id);
      if (!img) return;
      event.preventDefault();
      event.stopPropagation();
      state.selectedId = id;
      dragState = {
        id,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        initialX: img.x,
        initialY: img.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      render();
    }

    function onPointerMove(event) {
      if (!dragState) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      state.images = state.images.map((img) => (
        img.id === dragState.id
          ? { ...img, x: dragState.initialX + dx, y: dragState.initialY + dy }
          : img
      ));
      renderStage();
      syncPropertyFields();
      renderLayers();
    }

    function onPointerUp() {
      dragState = null;
    }

    function onWheel(event, id) {
      if (state.selectedId !== id) return;
      event.preventDefault();
      const img = state.images.find((item) => item.id === id);
      if (!img) return;
      const direction = event.deltaY > 0 ? -1 : 1;
      updateSelected({ scale: round(clamp(img.scale + direction * 0.05, 0.05, 5), 2) });
    }

    function imageNaturalWidth(img) {
      return img.naturalWidth || 320;
    }

    function imageNaturalHeight(img) {
      return img.naturalHeight || 240;
    }

    function setStatus(text) {
      els.status.textContent = text;
      window.clearTimeout(setStatus.timer);
      setStatus.timer = window.setTimeout(() => {
        if (els.status.textContent === text) els.status.textContent = "";
      }, 2600);
    }

    function downloadBlob(content, filename, type) {
      const blob = content instanceof Blob ? content : new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    els.imageInput.addEventListener("change", (event) => {
      addFiles(event.currentTarget.files);
      event.currentTarget.value = "";
    });

    els.layoutInput.addEventListener("change", (event) => {
      importLayout(event.currentTarget.files[0]);
      event.currentTarget.value = "";
    });

    els.workspace.addEventListener("pointermove", onPointerMove);
    els.workspace.addEventListener("pointerup", onPointerUp);
    els.workspace.addEventListener("pointercancel", onPointerUp);
    els.workspace.addEventListener("pointerleave", onPointerUp);
    els.workspace.addEventListener("click", (event) => {
      if (event.target === els.workspace || event.target === els.emptyState) select(null);
    });

    els.workspace.addEventListener("dragover", (event) => {
      event.preventDefault();
      els.workspace.classList.add("is-drag-over");
    });
    els.workspace.addEventListener("dragleave", () => els.workspace.classList.remove("is-drag-over"));
    els.workspace.addEventListener("drop", (event) => {
      event.preventDefault();
      els.workspace.classList.remove("is-drag-over");
      addFiles(event.dataTransfer.files);
    });

    root.addEventListener("input", (event) => {
      const field = event.target.dataset.field;
      const img = getSelectedImage();
      if (!field || !img) return;
      let value = Number(event.target.value);
      if (field === "scale") value = clamp(value, 0.05, 5);
      patchSelected({ [field]: value });
      renderStage();
      syncPropertyFields();
      renderLayers();
    });

    root.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      const layerItem = event.target.closest("[data-layer-id]");
      const layerMove = event.target.closest("[data-layer-move-id]");
      const nudge = event.target.closest("[data-nudge]");

      if (layerMove && !layerMove.disabled) {
        moveLayer(layerMove.dataset.layerMoveId, layerMove.dataset.layerMoveDirection);
        event.stopPropagation();
        return;
      }

      if (nudge) {
        const [dx, dy] = nudge.dataset.nudge.split(",").map(Number);
        const img = getSelectedImage();
        if (img) updateSelected({ x: img.x + dx, y: img.y + dy });
        return;
      }

      if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === "clear") clearAll();
        if (action === "delete-selected" && state.selectedId) deleteImage(state.selectedId);
        if (action === "center-selected") centerSelected();
        if (action === "export-json") exportJson();
        if (action === "export-png") exportPng();
        return;
      }

      if (layerItem) {
        select(layerItem.dataset.layerId);
      }
    });

    root.addEventListener("keydown", (event) => {
      const img = getSelectedImage();
      if (!img || event.target.matches("input")) return;
      const step = event.shiftKey ? 10 : 1;
      const deltas = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      if (deltas[event.key]) {
        event.preventDefault();
        const [dx, dy] = deltas[event.key];
        updateSelected({ x: img.x + dx, y: img.y + dy });
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteImage(img.id);
      }
    });

    render();

    return {
      getState: () => structuredCloneSafe(state),
      setState(nextState) {
        const next = structuredCloneSafe(nextState || DEFAULT_STATE);
        state.images = Array.isArray(next.images) ? next.images : [];
        state.selectedId = next.selectedId || state.images.at(-1)?.id || null;
        render();
      },
      addFiles,
      exportJson,
      exportPng,
    };
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  window.GraphTool = { create };
})();
