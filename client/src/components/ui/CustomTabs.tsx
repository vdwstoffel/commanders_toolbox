/**
 * Custom made tabs...
 */



interface Props {
  tabs: string[] | undefined;
  activeTab: number;
  tabHandler: (idx: number) => void;
  direction?: string;
}

export default function Tabs({ tabs, activeTab, tabHandler, direction = "row" }: Props) {
  return (
    <div role="tabs" className={ `${direction === "col" ? "flex-col" : "flex-row"}` + ` flex h-fit w-fit rounded-xl bg-card px-4 py-3 text-foreground`}>
      {tabs?.map((tab: string, idx: number) => (
        <div
          key={idx}
          onClick={() => tabHandler(idx)}
          className={
            (activeTab === idx ? "rounded-md bg-accent px-3 text-accent-foreground" : "px-3") +
            " hover:cursor-pointer hover:text-accent-foreground hover:bg-accent hover:rounded-md"
          }
        >
          {tab}
        </div>
      ))}
    </div>
  );
}