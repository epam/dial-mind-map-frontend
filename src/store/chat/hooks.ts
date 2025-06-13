import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { ChatAppDispatch, ChatRootState } from '.';

export const useChatDispatch: () => ChatAppDispatch = useDispatch;
export const useChatSelector: TypedUseSelectorHook<ChatRootState> = useSelector;
