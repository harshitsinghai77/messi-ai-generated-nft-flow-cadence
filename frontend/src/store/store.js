import { createContext, useReducer } from "react";
import * as types from "./types";

const initialState = {
  mintedImages: [],
};
const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case types.SET_MINTED_IMAGES:
        return { ...state, mintedImages: action.payload };

      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
