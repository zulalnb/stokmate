import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

export type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, style, ...rest }: InputProps) {
  return (
    <TextInput
      className={cn(
        "h-12 rounded-lg border border-background-selected px-4 py-0 text-base leading-5 text-foreground dark:border-background-selected-dark dark:text-foreground-dark",
        className,
      )}
      textAlignVertical="center"
      style={[{ borderCurve: "continuous" }, style]}
      {...rest}
    />
  );
}
