import { getMe, getRooms, getSettings } from "@/lib/data";
import { normalizeMonth } from "@/lib/month-view";
import { transferMemo, vietQrUrl } from "@/lib/vietqr";

/**
 * The signed-in person's payment QR as a same-origin image, so the browser can
 * save it: img.vietqr.io cannot be relied on to allow reading the file directly.
 */
export async function GET(request: Request) {
  const month = normalizeMonth(new URL(request.url).searchParams.get("month") ?? undefined);
  if (!month) return new Response(null, { status: 400 });

  const me = await getMe();
  const [rooms, settings] = await Promise.all([getRooms(), getSettings()]);
  const room = rooms.find((r) => r.id === me.roomId);
  if (!room || !settings?.bank_code || !settings.bank_account) return new Response(null, { status: 404 });

  const image = await fetch(
    vietQrUrl({
      bankCode: settings.bank_code,
      account: settings.bank_account,
      accountName: settings.bank_account_name,
      memo: transferMemo(room.code, month),
    }),
    { cache: "no-store" },
  ).catch(() => null);
  if (!image?.ok) return new Response(null, { status: 502 });

  return new Response(await image.arrayBuffer(), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" },
  });
}
