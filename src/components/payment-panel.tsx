import { cancelPaymentReport } from "@/app/actions/bills";
import { CopyButton } from "@/components/copy-button";
import { PaymentConfirm } from "@/components/payment-confirm";
import { SaveQrButton } from "@/components/save-qr-button";
import { SubmitButton } from "@/components/submit-button";
import { buttonClass } from "@/components/ui";
import type { getSettings } from "@/lib/data";
import { transferMemo, vietQrUrl } from "@/lib/vietqr";

/** How a room pays one closed, unpaid month: QR, account details and the report button. */
export function PaymentPanel({
  roomCode,
  month,
  periodId,
  reported,
  settings,
}: {
  roomCode: string;
  month: string;
  periodId: string;
  reported: boolean;
  settings: Awaited<ReturnType<typeof getSettings>>;
}) {
  const memo = transferMemo(roomCode, month);
  return (
    <>
      {settings && settings.bank_code && settings.bank_account ? (
        <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-line pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vietQrUrl({
              bankCode: settings.bank_code,
              account: settings.bank_account,
              accountName: settings.bank_account_name,
              memo,
            })}
            alt={`Mã QR chuyển khoản, nội dung ${memo}, tự nhập số tiền`}
            width={240}
            height={240}
            className="h-auto w-60 rounded-xl border border-line"
          />
          <SaveQrButton
            src={`/qr-image?month=${month.slice(0, 7)}`}
            fileName={`QR-${roomCode}-T${Number(month.slice(5, 7))}-${month.slice(0, 4)}.png`}
          />
          <dl className="w-full space-y-0.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Ngân hàng</dt>
              <dd className="text-right font-medium">{settings.bank_code}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Chủ tài khoản</dt>
              <dd className="text-right font-medium">{settings.bank_account_name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Số tài khoản</dt>
              <dd className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{settings.bank_account}</span>
                <CopyButton value={settings.bank_account} label="Sao chép số tài khoản" />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Nội dung</dt>
              <dd className="text-right font-medium">{memo}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      {reported ? (
        <form action={cancelPaymentReport} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="periodId" value={periodId} />
          <p className="rounded-xl bg-hl px-3 py-2 text-sm font-medium">
            Bạn đã báo thanh toán, đang chờ Trực hoặc Vi xác nhận.
          </p>
          <SubmitButton className={`${buttonClass.outline} w-full`}>Hủy báo thanh toán</SubmitButton>
        </form>
      ) : (
        <div className="mt-3">
          <PaymentConfirm periodId={periodId} />
        </div>
      )}
    </>
  );
}
