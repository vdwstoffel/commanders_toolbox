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
    <div role="tabs" className={ `${direction === "col" ? "flex-col" : "flex-row"}` + ` flex h-fit w-fit rounded-xl bg-neutral-900 px-4 py-3 text-neutral-200`}>
      {tabs?.map((tab: string, idx: number) => (
        <div
          key={idx}
          onClick={() => tabHandler(idx)}
          className={
            (activeTab === idx ? "rounded-md bg-slate-200/30 px-3 text-slate-100" : "px-3") +
            " hover:cursor-pointer hover:text-slate-50 hover:bg-slate-200/15 hover:rounded-md"
          }
        >
          {tab}
        </div>
      ))}
    </div>
  );
}