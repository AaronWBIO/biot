import { LOGIN, LOGOUT, RECOVER, PROFILE, UPDATE_USER } from '../ActionTypes';

export function user(state = {}, action) {
	switch (action.type) {
		case UPDATE_USER: {
			const { user } = action
			return {
				...state,
				...user
			};
		}
		case LOGIN : {
			const { user } = action
			return {
				...state,
				...user
			};
		}
		case PROFILE : {
			const { profile } = action
			return {
				...state,
				...profile
			};
		}
		case RECOVER: {
			const { status } = action
			return {
				...state,
				recoverStatus: status
			};
		}
	}
	return state;
}
