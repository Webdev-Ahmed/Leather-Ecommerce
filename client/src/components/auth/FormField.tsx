import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InputProps } from "@/components/ui/input";

type FormFieldProps = InputProps & {
  id: string;
  label: string;
  error?: string;
};

export function FormField({
  id,
  label,
  error,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          error &&
            "border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
          className,
        )}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11px] font-[var(--font-inter)] text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
