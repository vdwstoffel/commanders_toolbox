interface ThemeCardProps {
  themeName: string;
  onClickFn?: () => void;
}

export default function ThemeCard({ themeName, onClickFn }: ThemeCardProps) {

  return (
    <div
      onClick={onClickFn}
      className="border border-black p-1 cursor-pointer text-center hover:bg-black hover:text-white text-sm bg-gray-100 rounded-2xl m-1"
    >
      {themeName}
    </div>
  );
}
