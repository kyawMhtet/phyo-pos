import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { locale, dict } = await getDictionary();
  return <LoginForm dict={dict} locale={locale} />;
}
