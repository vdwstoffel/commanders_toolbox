import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Theme } from "@/api/edhRecApi";

interface ThemeSelectDropdownProps {
  themes: Theme[];
  setDeckTheme: (value: string) => void;
}

export default function ThemeSelectDropdown({ themes, setDeckTheme }: ThemeSelectDropdownProps) {
  return (
    <Select onValueChange={setDeckTheme}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Themes</SelectLabel>
          <SelectItem value="custom">Custom</SelectItem>
          {themes.map((theme, idx) => {
            return (
              <SelectItem key={idx} value={theme.slug}>
                {theme.value} ({theme.count})
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
