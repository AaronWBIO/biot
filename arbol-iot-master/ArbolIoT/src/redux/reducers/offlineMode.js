import { CHANGE_MODE } from '../ActionTypes';

export function mode(state = {}, action) {
	switch (action.type) {
		case CHANGE_MODE : {
            const { mode } = action;
			return mode;
		}
	}
	return state;
}