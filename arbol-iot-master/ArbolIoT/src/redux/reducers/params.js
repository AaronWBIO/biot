import { SET_PARAM } from '../ActionTypes';

export function param(state = {}, action) {
	switch (action.type) {
		case SET_PARAM : {
			const { param } = action;
			return {
				...state,
				...param
			};
		}
	}
	return state;
}