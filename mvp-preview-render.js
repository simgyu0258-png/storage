(function initPreviewRender(global) {
  const PAGE_SIZE = 20;
  let inventoryPage = 1;
  let historyPage = 1;

  function formatNow() {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  }

  function typeLabel(type) {
    if (type === "IN") return "입고";
    if (type === "OUT") return "출고";
    return "조정";
  }

  function showStatus(dom, message, isError) {
    dom.backupStatus.textContent = message;
    dom.backupStatus.style.color = isError ? "#9f1239" : "#64748b";
  }

  function renderWarehouseSelect(targetSelect, options) {
    const prev = targetSelect.value;
    targetSelect.innerHTML = "";
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      targetSelect.appendChild(option);
    });
    const exists = Array.from(targetSelect.options).some((o) => o.value === prev);
    targetSelect.value = exists ? prev : "";
  }

  function renderWarehouseSelects(dom, state) {
    const entries = Object.entries(state.warehouses).sort((a, b) => a[1].localeCompare(b[1]));

    renderWarehouseSelect(
      dom.warehouse,
      [{ value: "", label: "창고 선택" }, ...entries.map(([id, name]) => ({ value: id, label: name }))]
    );
    renderWarehouseSelect(
      dom.inventoryWarehouseFilter,
      [{ value: "", label: "전체 창고" }, ...entries.map(([id, name]) => ({ value: id, label: name }))]
    );
    renderWarehouseSelect(
      dom.historyWarehouseFilter,
      [{ value: "", label: "전체 창고" }, ...entries.map(([id, name]) => ({ value: id, label: name }))]
    );
    renderWarehouseSelect(
      dom.itemEditWarehouse,
      entries.map(([id, name]) => ({ value: id, label: name }))
    );

    dom.metricWarehouseCount.textContent = `${entries.length}개`;
  }

  function renderWarehouseManager(dom, state) {
    const entries = Object.entries(state.warehouses).sort((a, b) => a[1].localeCompare(b[1]));
    if (entries.length === 0) {
      dom.warehouseManageList.innerHTML = '<p class="help">등록된 창고가 없습니다. 위에서 창고를 추가해 주세요.</p>';
      return;
    }

    dom.warehouseManageList.innerHTML = entries
      .map(
        ([id, name]) => `
          <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-bottom:8px;">
            <input class="input" data-warehouse-name="${id}" value="${name.replaceAll('"', "&quot;")}" />
            <button type="button" class="mini-btn" data-action="save" data-id="${id}">이름 저장</button>
            <button type="button" class="mini-btn" data-action="delete" data-id="${id}" style="border-color:#fca5a5;color:#9f1239;">삭제</button>
          </div>
        `
      )
      .join("");
  }

  function renderItemSelect(dom, state) {
    const selectedId = dom.selectedItemId.value;
    const txType = dom.txTypeHidden?.value || "IN";
    const selectedWarehouseId = dom.warehouse?.value || "";

    if (!selectedId || !state.items[selectedId]) {
      dom.selectedItemId.value = "";
      dom.selectedItemName.value = "";
      return;
    }

    if (!selectedWarehouseId) {
      dom.selectedItemId.value = "";
      dom.selectedItemName.value = "";
      return;
    }

    const inv = state.inventory.find((x) => x.warehouseId === selectedWarehouseId && x.itemId === selectedId);
    if (txType === "IN") {
      if (!inv) {
        dom.selectedItemId.value = "";
        dom.selectedItemName.value = "";
        return;
      }
      dom.selectedItemName.value = `${state.items[selectedId].code} | ${state.items[selectedId].name} (${state.items[selectedId].unit})`;
      return;
    }

    if (!inv || inv.qty <= 0) {
      dom.selectedItemId.value = "";
      dom.selectedItemName.value = "";
      return;
    }
    dom.selectedItemName.value = `${state.items[selectedId].code} | ${state.items[selectedId].name} (${state.items[selectedId].unit}) | 재고 ${inv.qty}`;
  }

  function renderInventory(dom, state) {
    const selectedWarehouseId = dom.inventoryWarehouseFilter.value;
    const itemSearch = dom.inventoryItemSearch.value.trim().toLowerCase();

    const rows = [...state.inventory]
      .filter((row) => !selectedWarehouseId || row.warehouseId === selectedWarehouseId)
      .filter((row) => {
        if (!itemSearch) return true;
        const item = state.items[row.itemId];
        if (!item) return false;
        return item.name.toLowerCase().includes(itemSearch);
      })
      .sort((a, b) => {
        if (a.warehouseId === b.warehouseId) {
          return state.items[a.itemId].code.localeCompare(state.items[b.itemId].code);
        }
        return a.warehouseId.localeCompare(b.warehouseId);
      });

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (inventoryPage > totalPages) inventoryPage = totalPages;
    const start = (inventoryPage - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    dom.inventoryTbody.innerHTML = "";
    if (pageRows.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="4">조회 결과가 없습니다.</td>';
      dom.inventoryTbody.appendChild(tr);
    }

    pageRows.forEach((row) => {
      const item = state.items[row.itemId];
      if (!item) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${state.warehouses[row.warehouseId] || "(삭제된 창고)"}</td>
        <td>${item.code}</td>
        <td><button type="button" class="link-btn" data-action="edit-item" data-item-id="${item.id}" data-warehouse-id="${row.warehouseId}">${item.name}</button></td>
        <td>${row.qty}</td>
      `;
      dom.inventoryTbody.appendChild(tr);
    });

    dom.metricItemCount.textContent = `${Object.keys(state.items).length}개`;
    dom.inventoryPageInfo.textContent = `${inventoryPage} / ${totalPages} (총 ${rows.length}건)`;
    dom.inventoryPagePrev.disabled = inventoryPage <= 1;
    dom.inventoryPageNext.disabled = inventoryPage >= totalPages;
  }

  function renderHistory(dom, state) {
    const selectedWarehouseId = dom.historyWarehouseFilter.value;
    const itemSearch = dom.historyItemSearch.value.trim().toLowerCase();

    const filtered = state.history
      .filter((row) => !selectedWarehouseId || row.warehouseId === selectedWarehouseId)
      .filter((row) => {
        if (!itemSearch) return true;
        const item = state.items[row.itemId];
        if (!item) return false;
        return item.name.toLowerCase().includes(itemSearch);
      });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (historyPage > totalPages) historyPage = totalPages;
    const start = (historyPage - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    dom.historyTbody.innerHTML = "";
    pageRows.forEach((row) => {
      const item = state.items[row.itemId];
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${row.time}</td>
          <td>${row.type}</td>
          <td>${state.warehouses[row.warehouseId] || "(삭제된 창고)"}</td>
          <td>${item ? item.name : "-"}</td>
          <td>${row.qty}</td>
          <td>${row.before}</td>
          <td>${row.after}</td>
        `;
      dom.historyTbody.appendChild(tr);
    });

    if (dom.historyTbody.children.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="7">조회 결과가 없습니다.</td>';
      dom.historyTbody.appendChild(tr);
    }

    dom.historyPageInfo.textContent = `${historyPage} / ${totalPages} (총 ${filtered.length}건)`;
    dom.historyPagePrev.disabled = historyPage <= 1;
    dom.historyPageNext.disabled = historyPage >= totalPages;
  }

  function resetInventoryPage() {
    inventoryPage = 1;
  }

  function resetHistoryPage() {
    historyPage = 1;
  }

  function moveInventoryPage(delta) {
    inventoryPage = Math.max(1, inventoryPage + delta);
  }

  function moveHistoryPage(delta) {
    historyPage = Math.max(1, historyPage + delta);
  }

  function renderAll(dom, state) {
    renderWarehouseSelects(dom, state);
    renderItemSelect(dom, state);
    renderWarehouseManager(dom, state);
    renderInventory(dom, state);
    renderHistory(dom, state);
  }

  global.PreviewAppRender = {
    formatNow,
    typeLabel,
    showStatus,
    renderItemSelect,
    renderWarehouseSelects,
    renderWarehouseManager,
    renderInventory,
    renderHistory,
    resetInventoryPage,
    resetHistoryPage,
    moveInventoryPage,
    moveHistoryPage,
    renderAll,
  };
})(window);
