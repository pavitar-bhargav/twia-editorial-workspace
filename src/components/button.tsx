import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "terra" | "plain" | "quiet";
};

const tones = {
  terra: "bg-terra text-white hover:bg-terra-deep",
  plain: "border border-line bg-sheet text-ink hover:border-ink",
  quiet: "text-slate hover:text-ink",
};

export function Button({ tone = "plain", className = "", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
    />
  );
}
