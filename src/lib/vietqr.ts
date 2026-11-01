/**
 * Image URL of a VietQR code that opens in any Vietnamese banking app with the
 * receiving account, amount and message already filled in (img.vietqr.io).
 */
export function vietQrUrl(opts: {
  bankCode: string;
  account: string;
  accountName: string;
  amount: number;
  memo: string;
}): string {
  const base = `https://img.vietqr.io/image/${encodeURIComponent(opts.bankCode)}-${encodeURIComponent(
    opts.account,
  )}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(Math.round(opts.amount)),
    addInfo: opts.memo,
    accountName: opts.accountName,
  });
  return `${base}?${params.toString()}`;
}

/** Transfer message, kept to letters, digits and spaces so every bank accepts it: "102 T10 2026". */
export function transferMemo(roomCode: string, month: string): string {
  const [y, m] = month.split("-");
  return `${roomCode} T${Number(m)} ${y}`;
}
