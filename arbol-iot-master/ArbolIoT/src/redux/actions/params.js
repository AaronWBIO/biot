import { SET_PARAM } from '../ActionTypes';

const setParam = (param) => {
    const action = (dispatch) => {
        dispatch({
            type: SET_PARAM,
            param
        });
    };
    return action;
};

export {
    setParam
};