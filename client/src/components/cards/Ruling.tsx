import { useCardRulingsQuery } from "@/hooks/useScryfallQuery";

interface Props {
  rulingUri: string;
}

export default function Rulings({ rulingUri }: Readonly<Props>) {
  const { data: rules } = useCardRulingsQuery(rulingUri, true);

  if (!rules || rules.length < 1) return null;

  return (
    <div className="max-h-72 overflow-auto">
      <h3 className="font-bold">Rules</h3>
      {rules.map((rule, idx) => (
        <p key={rule.oracle_id + idx} className="mt-2 text-sm">
          {rule.comment}
        </p>
      ))}
    </div>
  );
}
