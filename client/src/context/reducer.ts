import { ActionType, InitialState, SET_ERROR, SET_HAS_SETUP_BACKEND } from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    // case SET_INTERACTIVE_PARAMS:
    //   return {
    //     ...state,
    //     hasInteractiveParams: true,
    //   };
    case SET_HAS_SETUP_BACKEND:
      return {
        ...state,
        ...payload,
        hasSetupBackend: true,
      };
    case SET_ERROR:
      return {
        ...state,
        error: payload?.error,
      };

    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
