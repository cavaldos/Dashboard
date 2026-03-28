import { createSlice } from '@reduxjs/toolkit';

type CountState = {
  value: number;
};

const initialState: CountState = {
  value: 0,
};

export const countSlice = createSlice({
  name: 'count',
  initialState,
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    reset: state => {
      state.value = 0;
    },
  },
});

export const { increment, decrement, reset } = countSlice.actions;
export default countSlice.reducer;
