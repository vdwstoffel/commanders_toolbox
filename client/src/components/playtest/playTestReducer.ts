interface State {
  hand: string[]; // contains image urls
  mulligan: number;
  drawnCard: boolean;
}

type Action = { type: "drawHand" | "mulligan"; payload: string[] } | { type: "drawCard"; payload: string };

const initialState: State = {
  hand: [],
  mulligan: 0,
  drawnCard: false,
};

function playTestReducer(state: State, action: Action) {
  switch (action.type) {
    case "drawHand":
      return { ...state, hand: action.payload, mulligan: 0, drawnCard: false };
    case "drawCard":
      return { ...state, hand: [...state.hand, action.payload], drawnCard: true };
    case "mulligan": {
      const newMulligan = (state.mulligan += 1);
      return { ...state, hand: action.payload, mulligan: newMulligan };
    }
    default:
      throw new Error(`Unknown action`);
  }
}

export { initialState, playTestReducer };