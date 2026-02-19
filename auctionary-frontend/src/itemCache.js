const KEY = "createdItemsCache";

export function readCreatedItemsCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addCreatedItem(item) {
  if (!item || item.item_id == null) return;

  const list = readCreatedItemsCache();
  const id = Number(item.item_id);

  const exists = list.some((x) => Number(x.item_id) === id);
  if (!exists) list.unshift(item);

  write(list);
}

export function clearCreatedItemsCache() {
  localStorage.removeItem(KEY);
}
