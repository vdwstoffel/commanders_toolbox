interface ThemeCardProps {
  themeName: string;
  onClickFn?: () => void;
}

export default function ThemeCard({ themeName, onClickFn }: ThemeCardProps) {

  return (
    <div
      onClick={onClickFn}
      className="border border-border p-1 cursor-pointer text-center hover:bg-primary hover:text-primary-foreground text-sm bg-card rounded-2xl m-1"
    >
      {themeName}
    </div>
  );
}
