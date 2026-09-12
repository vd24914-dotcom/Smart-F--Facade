/**
 * Проверка полей заявки. Один и тот же файл подключают и форма в браузере,
 * и сервер — чтобы «1» в телефоне нельзя было протолкнуть в обход страницы.
 */

/** Только цифры: «+998 (90) 123-45-67» → «998901234567». */
export function phoneDigits(value: string) {
  return (value ?? "").replace(/\D/g, "");
}

/** Буквы имени без пробелов и знаков — по ним считаем длину. */
function nameLetters(value: string) {
  return (value ?? "")
    .replace(/[^A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/g, "");
}

/** Имя: минимум две буквы. «1», «...», «12345» не проходят. */
export function isValidName(value: string) {
  return nameLetters(value).length >= 2;
}

/**
 * Телефон: от 9 до 15 цифр — так проходят и местные «90 123 45 67»,
 * и полные международные номера. Отсекаем одинаковые цифры подряд
 * («1111111111») и простые последовательности («1234567890»).
 */
export function isValidPhone(value: string) {
  const digits = phoneDigits(value);
  if (digits.length < 9 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  // «1234567890» — явная отписка. Проверяем только длинные номера:
  // местный девятизначный «901234567» сам по себе выглядит как отрезок
  // последовательности, и настоящие номера так терять нельзя.
  if (digits.length >= 10) {
    const straight = "01234567890123456789";
    const reversed = "98765432109876543210";
    if (straight.includes(digits) || reversed.includes(digits)) return false;
  }

  return true;
}

/** Площадь: необязательна, но если заполнена — положительное число. */
export function isValidArea(value: string) {
  const raw = (value ?? "").trim();
  if (!raw) return true;
  const number = Number(raw.replace(/[\s ]/g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 && number <= 1_000_000;
}

/** Приводит местный номер к международному виду: 901234567 → +998901234567. */
export function normalizePhone(value: string) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}
