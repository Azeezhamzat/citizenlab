/*
 *
 * IdeasShow reducer
 *
 */

import { fromJS } from 'immutable';
import {
  LOAD_IDEA_SUCCESS,
} from './constants';

const initialState = fromJS({
  idea: null,
});

function ideasShowReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_IDEA_SUCCESS:
      return state.set('idea', action.payload);
    default:
      return state;
  }
}

export default ideasShowReducer;
