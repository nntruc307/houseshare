/**
 * Image URL of a VietQR code that opens in any Vietnamese banking app with the
 * receiving account and message already filled in (img.vietqr.io). The amount
 * is left out on purpose: rooms may transfer more than the bill, for example
 * when they also use the washing machine.
 */
export function vietQrUrl(opts: {
  bankCode: string;
  account: string;
  accountName: string;
  memo: string;
}): string {
  const base = `https://img.vietqr.io/image/${encodeURIComponent(opts.bankCode)}-${encodeURIComponent(
    opts.account,
  )}-compact2.png`;
  const params = new URLSearchParams({
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
