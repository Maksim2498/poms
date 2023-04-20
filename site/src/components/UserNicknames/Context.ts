import { createContext               } from "react";
import { MaxUserNicknamesContextType } from "./types";

const MaxUserNicknamesContext = createContext(5 as MaxUserNicknamesContextType)

export default MaxUserNicknamesContext