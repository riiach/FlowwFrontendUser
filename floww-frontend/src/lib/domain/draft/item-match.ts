export const ITEMS = {
  acetaminophen: "acetaminophen-500mg-10",
  ibuprofen: "ibuprofen-200mg-20",
} as const;
export function matchItem(
  scope: string,
): (typeof ITEMS)[keyof typeof ITEMS] | null {
  const a = /타이레놀|아세트아미노펜|acetaminophen|tylenol/i.test(scope);
  const b = /이부프로펜|ibuprofen/i.test(scope);
  if (a === b) return null;
  return a ? ITEMS.acetaminophen : ITEMS.ibuprofen;
}
