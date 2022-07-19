const store = {};

const set = (key, value) => {
    store[key] = value;
    return { key, value }
}
const get = (key) => store[key];
const remove = (key) => delete store[key];
const setArray = (key, values) => {
const existedValues = get(key) || [];
    // TODO: check redis performance here (push instead of set) for big event batch processing 
    return set(key, [...existedValues, ...values]);
};

export const redis = {
    set,
    get,
    remove,
    setArray
}

