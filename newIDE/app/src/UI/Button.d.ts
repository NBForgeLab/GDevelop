export interface ButtonInterface {
  focus: () => void;
}

export function focusButton(
  button: ButtonInterface | HTMLButtonElement | null | undefined
): void;
