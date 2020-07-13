import { CHANGE_MODE } from '../ActionTypes';

const setMode = (mode) => {
    const action = (dispatch) => {
        dispatch({
            type: CHANGE_MODE,
            mode
        });
    };
    return action;
};

export {
    setMode
};