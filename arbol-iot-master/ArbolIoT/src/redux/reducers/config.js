import { SET_CONFIG } from '../ActionTypes';

export function config(state = {}, action) {
	switch (action.type) {
		case SET_CONFIG : {
			const { config } = action
			return {
				...state,
				...config,
			};
		}
	}
	return state;
}