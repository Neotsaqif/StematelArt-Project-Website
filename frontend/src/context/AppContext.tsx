import { createContext, useContext } from 'react';
import { AppContextType } from '../types';

export const AppCtx = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppCtx);
