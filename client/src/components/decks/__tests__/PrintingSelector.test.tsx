import { render, screen, fireEvent } from "@testing-library/react";
import PrintingSelector from "../PrintingSelector";

const printings = [
  { tcgplayer_id: 1, setName: "Dominaria", imageUrl: "dom.jpg" },
  { tcgplayer_id: 2, setName: "The Brothers' War", imageUrl: "bro.jpg" },
  { tcgplayer_id: 3, setName: "30th Anniversary", imageUrl: "30.jpg" },
];

describe("PrintingSelector", () => {
  it("renders a thumbnail per printing and marks the selected one", () => {
    render(<PrintingSelector printings={printings} selectedTcgId={2} onSelect={vi.fn()} />);
    expect(screen.getAllByTestId("printing-thumb")).toHaveLength(3);
    expect(screen.getByLabelText("Select printing: The Brothers' War")).toHaveAttribute("aria-pressed", "true");
  });

  it("filters printings by set name", () => {
    render(<PrintingSelector printings={printings} selectedTcgId={1} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Filter printings by set"), { target: { value: "brothers" } });
    expect(screen.getAllByTestId("printing-thumb")).toHaveLength(1);
    expect(screen.getByLabelText("Select printing: The Brothers' War")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", () => {
    render(<PrintingSelector printings={printings} selectedTcgId={1} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Filter printings by set"), { target: { value: "zzz" } });
    expect(screen.queryAllByTestId("printing-thumb")).toHaveLength(0);
    expect(screen.getByText(/No printings match/)).toBeInTheDocument();
  });

  it("calls onSelect with the clicked printing's id", () => {
    const onSelect = vi.fn();
    render(<PrintingSelector printings={printings} selectedTcgId={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText("Select printing: 30th Anniversary"));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
