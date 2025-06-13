import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { BuilderAppDispatch, BuilderRootState } from '.';

export const useBuilderDispatch: () => BuilderAppDispatch = useDispatch;
export const useBuilderSelector: TypedUseSelectorHook<BuilderRootState> = useSelector;
