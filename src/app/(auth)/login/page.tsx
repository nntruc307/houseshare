import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

const NOTICES: Record<string, string> = {
  inactive: "Tài khoản này đã ngừng hoạt động. Liên hệ Trực hoặc Vi nếu cần.",
  link: "Link đã hết hạn hoặc không hợp lệ. Hãy yêu cầu link mới.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const key = Array.isArray(error) ? error[0] : error;
  return (
    <>
      <LoginForm notice={key ? NOTICES[key] : undefined} />
      <p className="mt-auto text-center text-[13px] text-muted">
        Chưa có tài khoản? Liên hệ Trực hoặc Vi để được tạo.
      </p>
    </>
  );
}
