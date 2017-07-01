import axios from 'axios';
import base64 from 'base-64';
import { lang } from '../utils';
import {
  FETCH_ORDERS_REQUEST,
  FETCH_ORDERS_FAIL,
  FETCH_ORDERS_SUCCESS,

  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
} from '../constants';

const headers = {
  'Content-type': 'application/json',
};

export function create(token = null, data, cb = null) {
  if (token) {
    headers.Authorization = `Basic ${base64.encode(`${token}:`)}`;
  }
  return (dispatch) => {
    dispatch({ type: ORDER_CREATE_REQUEST });
    return axios({
      method: 'post',
      url: '/orders',
      headers: {
        Authorization: `Basic ${base64.encode(`${token}:`)}`,
      }
    })
    .then((response) => {
      dispatch({
        type: ORDER_CREATE_SUCCESS,
        payload: response.data,
      });
      if (cb) {
        cb(response.data);
      }
      console.log('ok', response.data);
    })
    .catch((error) => {
      console.log('fail', error.response.data);
      dispatch({
        type: ORDER_CREATE_FAIL,
        error,
      });
    });
  };
}

export function fetch(token, page = 1) {
  return (dispatch) => {
    dispatch({ type: FETCH_ORDERS_REQUEST });
    if (token) {
      headers.Authorization = `Basic ${base64.encode(`${token}:`)}`;
    }
    return axios({
      method: 'get',
      url: `/orders?items_per_page=100&page=${page}&sl=${lang}`,
      headers,
    })
    .then((response) => {
      dispatch({
        type: FETCH_ORDERS_SUCCESS,
        payload: response.data,
      });
    })
    .catch((error) => {
      dispatch({
        type: FETCH_ORDERS_FAIL,
        error,
      });
    });
  };
}
