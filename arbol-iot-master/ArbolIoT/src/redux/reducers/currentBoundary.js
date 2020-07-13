import { SET_CURRENT_BOUNDARY } from '../ActionTypes';

export function currentBoundary(state = {}, action) {
	switch (action.type) {
		case SET_CURRENT_BOUNDARY : {
			const { boundary } = action
			return {
                ...state,
                ...boundary
            };
		}
	}
	return state;
}