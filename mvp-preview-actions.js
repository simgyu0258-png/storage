(function initPreviewActions(global) {
  function collectDom() {
    return {
      mainTabWarehouse: document.getElementById("main-tab-warehouse"),
      mainTabTransaction: document.getElementById("main-tab-transaction"),
      viewWarehouse: document.getElementById("view-warehouse"),
      viewTransaction: document.getElementById("view-transaction"),
      whSubtabManage: document.getElementById("wh-subtab-manage"),
      whSubtabInventory: document.getElementById("wh-subtab-inventory"),
      warehouseManagePanel: document.getElementById("warehouse-manage-panel"),
      warehouseInventoryPanel: document.getElementById("warehouse-inventory-panel"),
      txSubtabIn: document.getElementById("tx-subtab-in"),
      txSubtabOut: document.getElementById("tx-subtab-out"),
      txSubtabHistory: document.getElementById("tx-subtab-history"),
      txFormPanel: document.getElementById("tx-form-panel"),
      txHistoryPanel: document.getElementById("tx-history-panel"),
      txFormTitle: document.getElementById("tx-form-title"),
      txTypeHidden: document.getElementById("tx-type-hidden"),
      form: document.getElementById("tx-form"),
      newItemToggleWrap: document.getElementById("new-item-toggle-wrap"),
      newItemToggle: document.getElementById("new-item-toggle"),
      newItemFields: document.getElementById("new-item-fields"),
      itemSearchOpenBtn: document.getElementById("item-search-open-btn"),
      selectedItemId: document.getElementById("selected-item-id"),
      selectedItemName: document.getElementById("selected-item-name"),
      newItemName: document.getElementById("new-item-name"),
      newItemCode: document.getElementById("new-item-code"),
      quantity: document.getElementById("quantity"),
      txError: document.getElementById("tx-error"),
      txOk: document.getElementById("tx-ok"),
      warehouse: document.getElementById("warehouse"),
      metricWarehouseCount: document.getElementById("metric-warehouse-count"),
      inventoryTbody: document.getElementById("inventory-tbody"),
      historyTbody: document.getElementById("history-tbody"),
      metricItemCount: document.getElementById("metric-item-count"),
      inventoryWarehouseFilter: document.getElementById("inventory-warehouse-filter"),
      inventoryItemSearch: document.getElementById("inventory-item-search"),
      inventoryPagePrev: document.getElementById("inventory-page-prev"),
      inventoryPageNext: document.getElementById("inventory-page-next"),
      inventoryPageInfo: document.getElementById("inventory-page-info"),
      historyWarehouseFilter: document.getElementById("history-warehouse-filter"),
      historyItemSearch: document.getElementById("history-item-search"),
      historyPagePrev: document.getElementById("history-page-prev"),
      historyPageNext: document.getElementById("history-page-next"),
      historyPageInfo: document.getElementById("history-page-info"),
      warehouseAddForm: document.getElementById("warehouse-add-form"),
      warehouseAddName: document.getElementById("warehouse-add-name"),
      warehouseManageList: document.getElementById("warehouse-manage-list"),
      backupDownloadBtn: document.getElementById("backup-download-btn"),
      backupRestoreBtn: document.getElementById("backup-restore-btn"),
      trashRestoreBtn: document.getElementById("trash-restore-btn"),
      backupFileInput: document.getElementById("backup-file-input"),
      localClearBtn: document.getElementById("local-clear-btn"),
      backupStatus: document.getElementById("backup-status"),
      itemSearchModal: document.getElementById("item-search-modal"),
      itemSearchCloseBtn: document.getElementById("item-search-close-btn"),
      itemSearchInput: document.getElementById("item-search-input"),
      itemSearchResults: document.getElementById("item-search-results"),
      itemEditModal: document.getElementById("item-edit-modal"),
      itemEditCloseBtn: document.getElementById("item-edit-close-btn"),
      itemEditSaveBtn: document.getElementById("item-edit-save-btn"),
      itemEditId: document.getElementById("item-edit-id"),
      itemEditSourceWarehouseId: document.getElementById("item-edit-source-warehouse-id"),
      itemEditCode: document.getElementById("item-edit-code"),
      itemEditWarehouse: document.getElementById("item-edit-warehouse"),
      itemEditName: document.getElementById("item-edit-name"),
      itemEditQty: document.getElementById("item-edit-qty"),
      itemEditError: document.getElementById("item-edit-error"),
    };
  }

  function setActive(buttons, activeButton) {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn === activeButton);
    });
  }

  function switchMainTab(dom, mode) {
    const isWarehouse = mode === "warehouse";
    dom.viewWarehouse.classList.toggle("hidden", !isWarehouse);
    dom.viewTransaction.classList.toggle("hidden", isWarehouse);
    setActive([dom.mainTabWarehouse, dom.mainTabTransaction], isWarehouse ? dom.mainTabWarehouse : dom.mainTabTransaction);
    if (isWarehouse) {
      setActive([dom.txSubtabIn, dom.txSubtabOut, dom.txSubtabHistory], null);
      return;
    }
    setActive([dom.whSubtabManage, dom.whSubtabInventory], null);
  }

  function switchWarehouseSubtab(dom, mode) {
    const isManage = mode !== "inventory";
    dom.warehouseManagePanel.classList.toggle("hidden", !isManage);
    dom.warehouseInventoryPanel.classList.toggle("hidden", isManage);
    setActive([dom.whSubtabManage, dom.whSubtabInventory], isManage ? dom.whSubtabManage : dom.whSubtabInventory);
  }

  function switchTxSubtab(dom, render, state, mode) {
    const mapping = {
      in: { type: "IN", title: "입고 등록", showForm: true, showHistory: false },
      out: { type: "OUT", title: "출고 등록", showForm: true, showHistory: false },
      history: { type: "OUT", title: "출고 등록", showForm: false, showHistory: true },
    };
    const current = mapping[mode] || mapping.in;

    dom.txTypeHidden.value = current.type;
    dom.txFormTitle.textContent = current.title;
    dom.txFormPanel.classList.toggle("hidden", !current.showForm);
    dom.txHistoryPanel.classList.toggle("hidden", !current.showHistory);

    setActive([dom.txSubtabIn, dom.txSubtabOut, dom.txSubtabHistory], mode === "out" ? dom.txSubtabOut : mode === "history" ? dom.txSubtabHistory : dom.txSubtabIn);

    if (current.type !== "IN") {
      dom.newItemToggle.checked = false;
    }
    updateUiByType(dom);
    render.renderItemSelect(dom, state);

    if (current.showHistory) {
      render.resetHistoryPage();
      render.renderHistory(dom, state);
    }
  }

  function updateNewItemUi(dom) {
    const useNewItem = dom.newItemToggle.checked && dom.txTypeHidden.value === "IN";
    dom.newItemFields.classList.toggle("hidden", !useNewItem);
    dom.itemSearchOpenBtn.disabled = useNewItem;
    dom.selectedItemName.style.background = useNewItem ? "#f1f5f9" : "#ffffff";
    if (useNewItem) {
      dom.selectedItemId.value = "";
      dom.selectedItemName.value = "";
    }
  }

  function updateUiByType(dom) {
    const isIn = dom.txTypeHidden.value === "IN";
    dom.newItemToggleWrap.classList.toggle("hidden", !isIn);
    if (!isIn) {
      dom.newItemToggle.checked = false;
    }
    updateNewItemUi(dom);
  }

  function attachActions(dom, data, render) {
    const state = data.state;

    function getSelectableItems() {
      const type = dom.txTypeHidden.value;
      const selectedWarehouseId = dom.warehouse.value;
      const q = dom.itemSearchInput.value.trim().toLowerCase();

      const qtyByItemId = {};
      if (selectedWarehouseId) {
        state.inventory
          .filter((inv) => inv.warehouseId === selectedWarehouseId)
          .forEach((inv) => {
            qtyByItemId[inv.itemId] = inv.qty;
          });
      }

      return Object.values(state.items)
        .filter((item) => {
          // 입고/출고 모두 선택한 창고 기준 품목만 표시
          if (!selectedWarehouseId) return false;
          const hasInventoryRecord = Object.prototype.hasOwnProperty.call(qtyByItemId, item.id);
          if (type === "IN" && !hasInventoryRecord) return false;
          if (type === "OUT" && (qtyByItemId[item.id] || 0) <= 0) return false;
          if (!q) return true;
          return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
        })
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((item) => ({
          ...item,
          qty: qtyByItemId[item.id] || 0,
        }));
    }

    function renderItemSearchResults() {
      const type = dom.txTypeHidden.value;
      const selectedWarehouseId = dom.warehouse.value;
      const rows = getSelectableItems();
      dom.itemSearchResults.innerHTML = "";

      if (!selectedWarehouseId) {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td colspan="4">먼저 창고를 선택해 주세요.</td>';
        dom.itemSearchResults.appendChild(tr);
        return;
      }

      if (rows.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td colspan="4">검색 결과가 없습니다.</td>';
        dom.itemSearchResults.appendChild(tr);
        return;
      }

      rows.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.code}</td>
          <td>${item.name}</td>
          <td>${type === "OUT" ? item.qty : "-"}</td>
          <td><button type="button" class="mini-btn" data-item-id="${item.id}">선택</button></td>
        `;
        dom.itemSearchResults.appendChild(tr);
      });
    }

    function openItemSearchModal() {
      renderItemSearchResults();
      dom.itemSearchModal.classList.remove("hidden");
      dom.itemSearchInput.focus();
    }

    function closeItemSearchModal() {
      dom.itemSearchModal.classList.add("hidden");
      dom.itemSearchInput.value = "";
    }

    function openItemEditModal(itemId, warehouseId) {
      const item = state.items[itemId];
      if (!item || !warehouseId) return;
      const inv = state.inventory.find((x) => x.warehouseId === warehouseId && x.itemId === itemId);
      if (!inv) return;
      dom.itemEditId.value = item.id;
      dom.itemEditSourceWarehouseId.value = warehouseId;
      dom.itemEditCode.value = item.code;
      dom.itemEditWarehouse.value = warehouseId;
      dom.itemEditName.value = item.name;
      dom.itemEditQty.value = String(inv.qty);
      dom.itemEditError.classList.add("hidden");
      dom.itemEditError.textContent = "";
      dom.itemEditModal.classList.remove("hidden");
      dom.itemEditName.focus();
      dom.itemEditName.select();
    }

    function closeItemEditModal() {
      dom.itemEditModal.classList.add("hidden");
      dom.itemEditId.value = "";
      dom.itemEditSourceWarehouseId.value = "";
      dom.itemEditError.classList.add("hidden");
      dom.itemEditError.textContent = "";
    }

    dom.mainTabWarehouse.addEventListener("click", () => {
      switchMainTab(dom, "warehouse");
      switchWarehouseSubtab(dom, "manage");
    });
    dom.whSubtabManage.addEventListener("click", () => {
      switchMainTab(dom, "warehouse");
      switchWarehouseSubtab(dom, "manage");
    });
    dom.whSubtabInventory.addEventListener("click", () => {
      switchMainTab(dom, "warehouse");
      switchWarehouseSubtab(dom, "inventory");
    });
    dom.mainTabTransaction.addEventListener("click", () => {
      switchMainTab(dom, "transaction");
      switchTxSubtab(dom, render, state, "in");
    });
    dom.txSubtabIn.addEventListener("click", () => {
      switchMainTab(dom, "transaction");
      switchTxSubtab(dom, render, state, "in");
    });
    dom.txSubtabOut.addEventListener("click", () => {
      switchMainTab(dom, "transaction");
      switchTxSubtab(dom, render, state, "out");
    });
    dom.txSubtabHistory.addEventListener("click", () => {
      switchMainTab(dom, "transaction");
      switchTxSubtab(dom, render, state, "history");
    });

    dom.newItemToggle.addEventListener("change", () => updateNewItemUi(dom));
    dom.warehouse.addEventListener("change", () => render.renderItemSelect(dom, state));
    dom.itemSearchOpenBtn.addEventListener("click", openItemSearchModal);
    dom.itemSearchCloseBtn.addEventListener("click", closeItemSearchModal);
    dom.itemSearchInput.addEventListener("input", renderItemSearchResults);
    dom.itemSearchModal.addEventListener("click", (e) => {
      if (e.target === dom.itemSearchModal) {
        closeItemSearchModal();
      }
    });
    dom.itemSearchResults.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-item-id]");
      if (!btn) return;
      const itemId = btn.dataset.itemId;
      const item = state.items[itemId];
      if (!item) return;
      dom.selectedItemId.value = itemId;
      render.renderItemSelect(dom, state);
      closeItemSearchModal();
    });
    dom.inventoryTbody.addEventListener("click", (e) => {
      const button = e.target.closest('button[data-action="edit-item"]');
      if (!button) return;
      const itemId = button.dataset.itemId;
      const warehouseId = button.dataset.warehouseId;
      if (!itemId || !warehouseId) return;
      openItemEditModal(itemId, warehouseId);
    });
    dom.itemEditCloseBtn.addEventListener("click", closeItemEditModal);
    dom.itemEditModal.addEventListener("click", (e) => {
      if (e.target === dom.itemEditModal) {
        closeItemEditModal();
      }
    });
    dom.itemEditSaveBtn.addEventListener("click", () => {
      const itemId = dom.itemEditId.value;
      const sourceWarehouseId = dom.itemEditSourceWarehouseId.value;
      const targetWarehouseId = dom.itemEditWarehouse.value;
      const item = state.items[itemId];
      if (!item || !sourceWarehouseId || !targetWarehouseId) {
        dom.itemEditError.textContent = "수정할 품목을 찾을 수 없습니다.";
        dom.itemEditError.classList.remove("hidden");
        return;
      }
      const nextName = dom.itemEditName.value.trim();
      const nextQty = Number(dom.itemEditQty.value);
      if (!nextName) {
        dom.itemEditError.textContent = "품목명은 비워둘 수 없습니다.";
        dom.itemEditError.classList.remove("hidden");
        return;
      }
      if (Number.isNaN(nextQty) || nextQty < 0) {
        dom.itemEditError.textContent = "현재 수량은 0 이상 숫자로 입력해 주세요.";
        dom.itemEditError.classList.remove("hidden");
        return;
      }

      const sourceInv = state.inventory.find((x) => x.warehouseId === sourceWarehouseId && x.itemId === itemId);
      if (!sourceInv) {
        dom.itemEditError.textContent = "원본 재고 행을 찾을 수 없습니다.";
        dom.itemEditError.classList.remove("hidden");
        return;
      }

      if (sourceWarehouseId !== targetWarehouseId) {
        const duplicateTarget = state.inventory.find((x) => x.warehouseId === targetWarehouseId && x.itemId === itemId);
        if (duplicateTarget) {
          dom.itemEditError.textContent = "선택한 창고에 같은 품목이 이미 있습니다. 창고를 바꾸지 않거나 기존 행을 먼저 정리해 주세요.";
          dom.itemEditError.classList.remove("hidden");
          return;
        }
      }

      item.name = nextName;
      sourceInv.warehouseId = targetWarehouseId;
      sourceInv.qty = nextQty;
      data.saveToLocal();
      render.renderAll(dom, state);
      closeItemEditModal();
      render.showStatus(dom, "창고/품목명/현재 수량을 수정했습니다.", false);
    });

    dom.inventoryWarehouseFilter.addEventListener("change", () => {
      render.resetInventoryPage();
      render.renderInventory(dom, state);
    });
    dom.inventoryItemSearch.addEventListener("input", () => {
      render.resetInventoryPage();
      render.renderInventory(dom, state);
    });
    dom.historyWarehouseFilter.addEventListener("change", () => {
      render.resetHistoryPage();
      render.renderHistory(dom, state);
    });
    dom.historyItemSearch.addEventListener("input", () => {
      render.resetHistoryPage();
      render.renderHistory(dom, state);
    });
    dom.inventoryPagePrev.addEventListener("click", () => {
      render.moveInventoryPage(-1);
      render.renderInventory(dom, state);
    });
    dom.inventoryPageNext.addEventListener("click", () => {
      render.moveInventoryPage(1);
      render.renderInventory(dom, state);
    });
    dom.historyPagePrev.addEventListener("click", () => {
      render.moveHistoryPage(-1);
      render.renderHistory(dom, state);
    });
    dom.historyPageNext.addEventListener("click", () => {
      render.moveHistoryPage(1);
      render.renderHistory(dom, state);
    });

    dom.warehouseAddForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = dom.warehouseAddName.value.trim();
      if (!name) {
        render.showStatus(dom, "창고 이름을 입력해 주세요.", true);
        return;
      }
      const duplicate = Object.values(state.warehouses).some((n) => n === name);
      if (duplicate) {
        render.showStatus(dom, "같은 이름의 창고가 이미 있습니다.", true);
        return;
      }

      const id = `wh${Date.now()}`;
      state.warehouses[id] = name;
      dom.warehouseAddName.value = "";
      data.saveToLocal();
      render.renderAll(dom, state);
      render.showStatus(dom, "새 창고를 추가했습니다.", false);
    });

    dom.warehouseManageList.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      const id = button.dataset.id;
      if (!id || !state.warehouses[id]) return;

      if (action === "save") {
        const input = dom.warehouseManageList.querySelector(`input[data-warehouse-name="${id}"]`);
        const nextName = input?.value.trim();
        if (!nextName) {
          render.showStatus(dom, "창고 이름은 비워둘 수 없습니다.", true);
          return;
        }
        const duplicate = Object.entries(state.warehouses).some(([wid, name]) => wid !== id && name === nextName);
        if (duplicate) {
          render.showStatus(dom, "같은 이름의 창고가 이미 있습니다.", true);
          return;
        }

        state.warehouses[id] = nextName;
        data.saveToLocal();
        render.renderAll(dom, state);
        render.showStatus(dom, "창고 이름을 수정했습니다.", false);
        return;
      }

      if (action === "delete") {
        if (!confirm(`"${state.warehouses[id]}" 창고를 삭제할까요? 관련 재고/이력도 함께 삭제됩니다.`)) {
          return;
        }

        delete state.warehouses[id];
        for (let i = state.inventory.length - 1; i >= 0; i -= 1) {
          if (state.inventory[i].warehouseId === id) {
            state.inventory.splice(i, 1);
          }
        }
        for (let i = state.history.length - 1; i >= 0; i -= 1) {
          if (state.history[i].warehouseId === id) {
            state.history.splice(i, 1);
          }
        }

        data.saveToLocal();
        render.renderAll(dom, state);
        render.showStatus(dom, "창고를 삭제했습니다.", false);
      }
    });

    dom.backupDownloadBtn.addEventListener("click", () => {
      try {
        const payload = {
          version: 1,
          savedAt: new Date().toISOString(),
          data: data.getSnapshot(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `warehouse-mvp-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        render.showStatus(dom, "백업 파일을 다운로드했습니다.", false);
      } catch {
        render.showStatus(dom, "백업 다운로드 중 오류가 발생했습니다.", true);
      }
    });

    dom.backupRestoreBtn.addEventListener("click", () => dom.backupFileInput.click());
    dom.backupFileInput.addEventListener("change", async (event) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const parsed = JSON.parse(text);
        const snapshot = parsed?.data ?? parsed;
        data.applySnapshot(snapshot);
        data.saveToLocal();
        render.renderAll(dom, state);
        render.showStatus(dom, "백업 파일에서 데이터를 복원했습니다.", false);
      } catch {
        render.showStatus(dom, "복원 실패: 올바른 JSON 백업 파일인지 확인해 주세요.", true);
      } finally {
        dom.backupFileInput.value = "";
      }
    });

    dom.localClearBtn.addEventListener("click", () => {
      const code = prompt("초기화 코드를 입력해 주세요. (RESET)");
      if (code !== "RESET") {
        render.showStatus(dom, "초기화가 취소되었습니다. 코드가 일치하지 않습니다.", true);
        return;
      }

      data.saveTrashSnapshot(data.getSnapshot());
      data.resetOperationalData();
      data.saveToLocal();
      render.renderAll(dom, state);
      render.showStatus(dom, "초기화 완료. 샘플 품목/재고/이력이 모두 비워졌고, 직전 데이터는 휴지통(최근 1회)에 보관되었습니다.", false);
    });

    dom.trashRestoreBtn.addEventListener("click", () => {
      try {
        const trash = data.loadTrashSnapshot();
        if (!trash) {
          render.showStatus(dom, "휴지통에 복구할 데이터가 없습니다.", true);
          return;
        }
        data.applySnapshot(trash.data);
        data.saveToLocal();
        render.renderAll(dom, state);
        render.showStatus(dom, `휴지통 데이터 복구 완료 (${new Date(trash.deletedAt).toLocaleString("ko-KR")}).`, false);
      } catch {
        render.showStatus(dom, "휴지통 복구 중 오류가 발생했습니다.", true);
      }
    });

    dom.form.addEventListener("submit", (e) => {
      e.preventDefault();
      dom.txError.classList.add("hidden");
      dom.txOk.classList.add("hidden");
      dom.txError.textContent = "";

      const type = dom.txTypeHidden.value;
      const useNewItem = dom.newItemToggle.checked && type === "IN";

      if (!dom.warehouse.value) {
        dom.txError.textContent = "창고를 선택해 주세요.";
        dom.txError.classList.remove("hidden");
        return;
      }

      if (useNewItem) {
        if (!dom.newItemName.value.trim()) {
          dom.txError.textContent = "신규 품목명을 입력해 주세요.";
          dom.txError.classList.remove("hidden");
          return;
        }
      } else if (!dom.selectedItemId.value) {
        dom.txError.textContent = "품목을 선택해 주세요.";
        dom.txError.classList.remove("hidden");
        return;
      }

      const qty = Number(dom.quantity.value);
      if (Number.isNaN(qty) || qty < 0) {
        dom.txError.textContent = "수량은 0 이상으로 입력해 주세요.";
        dom.txError.classList.remove("hidden");
        return;
      }
      if ((type === "IN" || type === "OUT") && qty <= 0) {
        dom.txError.textContent = "입고/출고 수량은 1 이상이어야 합니다.";
        dom.txError.classList.remove("hidden");
        return;
      }

      let targetItemId = dom.selectedItemId.value;
      if (useNewItem) {
        const newId = `i${Date.now()}`;
        const rawCode = dom.newItemCode.value.trim();
        state.items[newId] = {
          id: newId,
          code: rawCode || `ITM-${String(Object.keys(state.items).length + 1).padStart(4, "0")}`,
          name: dom.newItemName.value.trim(),
          unit: "개",
        };
        targetItemId = newId;
        dom.selectedItemId.value = newId;
      }

      if (!targetItemId) {
        dom.txError.textContent = "품목을 선택해 주세요.";
        dom.txError.classList.remove("hidden");
        return;
      }

      let inv = state.inventory.find((x) => x.warehouseId === dom.warehouse.value && x.itemId === targetItemId);
      if (!inv) {
        inv = { warehouseId: dom.warehouse.value, itemId: targetItemId, qty: 0 };
        state.inventory.push(inv);
      }

      const beforeQty = inv.qty;
      let afterQty = beforeQty;
      let txQty = qty;

      if (type === "IN") {
        afterQty = beforeQty + qty;
      } else if (type === "OUT") {
        if (beforeQty < qty) {
          dom.txError.textContent = `출고 수량이 현재 재고(${beforeQty})보다 많습니다.`;
          dom.txError.classList.remove("hidden");
          return;
        }
        afterQty = beforeQty - qty;
      } else {
        afterQty = qty;
        txQty = Math.abs(afterQty - beforeQty);
      }

      inv.qty = afterQty;
      state.history.unshift({
        time: render.formatNow(),
        type: render.typeLabel(type),
        warehouseId: dom.warehouse.value,
        itemId: targetItemId,
        qty: txQty,
        before: beforeQty,
        after: afterQty,
      });

      data.saveToLocal();
      render.renderAll(dom, state);
      dom.txOk.textContent = useNewItem
        ? "신규 품목 등록 후 입고가 저장되었습니다. (HTML 미리보기 데모)"
        : "저장되었습니다. (HTML 미리보기 데모)";
      dom.txOk.classList.remove("hidden");
    });
  }

  function bootstrap() {
    const data = global.PreviewAppData;
    const render = global.PreviewAppRender;
    const dom = collectDom();

    switchTxSubtab(dom, render, data.state, "in");
    switchMainTab(dom, "warehouse");
    switchWarehouseSubtab(dom, "manage");
    try {
      data.loadFromLocal();
      render.showStatus(dom, "", false);
    } catch {
      render.showStatus(dom, "로컬 저장 데이터 로드에 실패해 초기 데이터로 시작합니다.", true);
    }

    render.renderAll(dom, data.state);
    attachActions(dom, data, render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})(window);
