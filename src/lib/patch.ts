/**
 * Точечное сохранение.
 *
 * Каждый раздел админки держит в памяти копию всего файла с текстами.
 * Если сохранять эту копию целиком, то вкладка, открытая пораньше, затирает
 * правки, сделанные в другом разделе. Поэтому мы считаем, что именно
 * изменилось, и на сервере применяем только эти места к свежему файлу.
 */

export type Change = {
  /** путь вида "pages.about.heading" */
  path: string;
  /** новое значение; отсутствует — значит поле нужно удалить */
  value?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Сравнивает «как было» и «как стало» и возвращает список изменившихся мест.
 * Списки и обычные значения берутся целиком — внутрь массивов не лезем,
 * иначе перестановка строк превратилась бы в кашу из мелких правок.
 */
export function diffChanges(base: unknown, next: unknown, prefix = ""): Change[] {
  if (same(base, next)) return [];

  if (!isPlainObject(base) || !isPlainObject(next)) {
    return [{ path: prefix, value: next }];
  }

  const changes: Change[] = [];
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);

  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (!(key in next)) {
      changes.push({ path });
      continue;
    }
    if (!(key in base)) {
      changes.push({ path, value: next[key] });
      continue;
    }
    changes.push(...diffChanges(base[key], next[key], path));
  }

  return changes;
}

/** Применяет список изменений к объекту и возвращает новый объект. */
export function applyChanges<T>(target: T, changes: Change[]): T {
  const root: unknown = isPlainObject(target) ? { ...target } : target;

  for (const change of changes) {
    if (!change.path) return (change.value as T) ?? (undefined as T);

    const keys = change.path.split(".");
    let node = root as Record<string, unknown>;

    for (const key of keys.slice(0, -1)) {
      const child = node[key];
      node[key] = isPlainObject(child) ? { ...child } : {};
      node = node[key] as Record<string, unknown>;
    }

    const last = keys[keys.length - 1];
    if ("value" in change) node[last] = change.value;
    else delete node[last];
  }

  return root as T;
}
