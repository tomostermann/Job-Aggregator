import { colorFromString, initialsOf } from "@/lib/format";

export function CompanyAvatar({
  name,
  size = "md",
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dim = {
    sm: "h-8 w-8 text-[11px] rounded-lg",
    md: "h-12 w-12 text-sm rounded-xl",
    lg: "h-14 w-14 text-base rounded-2xl",
    xl: "h-16 w-16 text-lg rounded-2xl",
  }[size];
  const label = name || "??";
  const initials = initialsOf(label).slice(0, 1);
  const bg = colorFromString(label);
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center font-bold text-white font-display ${dim}`}
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)` }}
    >
      {initials}
    </div>
  );
}
