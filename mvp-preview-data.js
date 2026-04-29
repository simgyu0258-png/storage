(function initPreviewData(global) {
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function replaceObject(target, source) {
    Object.keys(target).forEach((key) => delete target[key]);
    Object.entries(source).forEach(([key, val]) => {
      target[key] = val;
    });
  }

  function replaceArray(target, source) {
    target.splice(0, target.length, ...source);
  }

  const STORAGE_KEY = "warehouse_mvp_preview_v1";
  const STORAGE_TRASH_KEY = "warehouse_mvp_preview_trash_v1";

  const initialWarehouses = {
    wh1: "창고 1",
    wh2: "창고 2",
  };

  const initialItems = {
    i1: { id: "i1", code: "ITM-0001", name: "A4 복사용지", unit: "박스" },
    i2: { id: "i2", code: "ITM-0002", name: "무선 마우스", unit: "개" },
    i3: { id: "i3", code: "ITM-0003", name: "멀티탭", unit: "개" },
  };

  const initialInventory = [
    { warehouseId: "wh1", itemId: "i1", qty: 18 },
    { warehouseId: "wh1", itemId: "i2", qty: 4 },
    { warehouseId: "wh2", itemId: "i3", qty: 7 },
  ];

  const initialHistory = [
    {
      time: "2026-04-13 10:21",
      type: "출고",
      warehouseId: "wh1",
      itemId: "i1",
      qty: 2,
      before: 20,
      after: 18,
    },
    {
      time: "2026-04-13 09:10",
      type: "조정",
      warehouseId: "wh2",
      itemId: "i3",
      qty: 1,
      before: 8,
      after: 7,
    },
  ];

  const state = {
    warehouses: deepClone(initialWarehouses),
    items: deepClone(initialItems),
    inventory: deepClone(initialInventory),
    history: deepClone(initialHistory),
  };

  function getSnapshot() {
    return {
      warehouses: deepClone(state.warehouses),
      items: deepClone(state.items),
      inventory: deepClone(state.inventory),
      history: deepClone(state.history),
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("백업 데이터 형식이 올바르지 않습니다.");
    }
    if (!snapshot.items || !Array.isArray(snapshot.inventory) || !Array.isArray(snapshot.history)) {
      throw new Error("백업 데이터에 필요한 정보가 없습니다.");
    }

    if (snapshot.warehouses && typeof snapshot.warehouses === "object") {
      replaceObject(state.warehouses, snapshot.warehouses);
    }
    replaceObject(state.items, snapshot.items);
    replaceArray(state.inventory, snapshot.inventory);
    replaceArray(state.history, snapshot.history);
  }

  function saveToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSnapshot()));
  }

  function loadFromLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    applySnapshot(parsed);
    return true;
  }

  function saveTrashSnapshot(snapshot) {
    const payload = {
      deletedAt: new Date().toISOString(),
      data: snapshot,
    };
    localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(payload));
  }

  function loadTrashSnapshot() {
    const raw = localStorage.getItem(STORAGE_TRASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data) return null;
    return parsed;
  }

  function resetOperationalData() {
    replaceObject(state.items, {});
    replaceArray(state.inventory, []);
    replaceArray(state.history, []);
  }

  global.PreviewAppData = {
    STORAGE_KEY,
    STORAGE_TRASH_KEY,
    initialWarehouses,
    initialItems,
    initialInventory,
    initialHistory,
    state,
    deepClone,
    replaceObject,
    replaceArray,
    getSnapshot,
    applySnapshot,
    saveToLocal,
    loadFromLocal,
    saveTrashSnapshot,
    loadTrashSnapshot,
    resetOperationalData,
  };
})(window);
