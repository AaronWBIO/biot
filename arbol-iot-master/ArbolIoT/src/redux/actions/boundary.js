
import BoundaryService from '../../services/boundary';
import TreeService from '../../services/tree';
import { SYNC_BOUNDARY_FAVS, SET_CURRENT_BOUNDARY, SAVE_LOCAL_BOUNDARY, REMOVE_LOCAL_BOUNDARY } from '../ActionTypes';

const syncBoundaryFavs = () => {
    const action = (dispatch) => {
        BoundaryService.getFavorites()
        .then((res) => res.json())
        .then(res => {
            var boundaryFavs = res;
            dispatch({
                type: SYNC_BOUNDARY_FAVS,
                boundaryFavs
            });
        })
        .catch((e) => {
        });
    };
    return action;
};

const setCurrentLocalBoundary = (boundary) => {
    const action = (dispatch) => {
        dispatch({
            type: SAVE_LOCAL_BOUNDARY,
            boundary
        });
    };
    return action;
}

const clearLocalBoundary = (id) => {
    const action = (dispatch) => {
        dispatch({
            type: REMOVE_LOCAL_BOUNDARY,
        });
    };
    return action;
}

const setCurrentBoundary = (boundary) => {
    const action = (dispatch) => {
        dispatch({
            type: SET_CURRENT_BOUNDARY,
            boundary
        });
    };
    return action;
};

export {
    syncBoundaryFavs,
    setCurrentBoundary,
    setCurrentLocalBoundary,
    clearLocalBoundary
};