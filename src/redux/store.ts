import countSlice from './features/countSlice';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    count: countSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
