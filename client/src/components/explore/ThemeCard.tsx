interface ThemeCardProps {
  themeName: string;
  onClickFn?: () => void;
}

export default function ThemeCard({ themeName, onClickFn }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClickFn}
      title={themeName}
      className="w-full truncate rounded-2xl border border-border bg-card px-3 py-2 text-center text-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {themeName}
    </button>
  );
}
