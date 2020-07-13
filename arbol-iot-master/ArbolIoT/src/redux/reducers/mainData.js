import { SET_LAST_MAIN_DATA } from '../ActionTypes';

export function mainData(state = {}, action) {
	switch (action.type) {
		case SET_LAST_MAIN_DATA : {
			const { lastData } = action
			return {
                ...state,
                ...lastData,
			};
		}
	}
	return state;
}