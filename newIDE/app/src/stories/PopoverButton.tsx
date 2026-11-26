import * as React from 'react';

type ChildrenProps = {
  buttonElement: HTMLElement | null | undefined;
  onClose: () => void;
};

type Props = {
  children: (childrenProps: ChildrenProps) => React.ReactNode;
};

export function PopoverButton({ children }: Props): React.ReactNode {
  const [buttonElement, setButtonElement] = React.useState(
    null as HTMLElement | null | undefined
  );

  return (
    <React.Fragment>
      <button
        onClick={(event) => {
          setButtonElement(event.target as HTMLElement);
        }}
      >
        Click to open
      </button>
      {buttonElement &&
        children({
          buttonElement,
          onClose: () => setButtonElement(null),
        })}
    </React.Fragment>
  );
}
