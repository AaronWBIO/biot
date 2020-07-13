import { UPDATE_NOTIFICATIONS_INDICATOR } from '../ActionTypes';

export function notificationsIndicator(state = {}, action) {
	switch (action.type) {
		case UPDATE_NOTIFICATIONS_INDICATOR : {
			const { count } = action
			return {
                count:action.count,
			};
		}
	}
	return state;
}