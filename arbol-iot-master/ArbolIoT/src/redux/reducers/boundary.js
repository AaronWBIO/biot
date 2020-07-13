import { SYNC_BOUNDARY_FAVS, SAVE_LOCAL_BOUNDARY, REMOVE_LOCAL_BOUNDARY } from '../ActionTypes';

const boundaryFavs = (state = {}, action) => {
	switch (action.type) {
		case SYNC_BOUNDARY_FAVS : {
			const { boundaryFavs } = action
			return boundaryFavs;
		}
	}
	return state;
}

const localBoundary = (state = {}, action) => {
	switch (action.type) {
		case SAVE_LOCAL_BOUNDARY : {
			const { boundary } = action
			return boundary;
		}
		case REMOVE_LOCAL_BOUNDARY : {
			return {};
		}
	}
	return state;
}

export {
	boundaryFavs,
	localBoundary
};