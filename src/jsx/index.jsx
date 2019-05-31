import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Cookies from 'js-cookie';
import App from './components/App';
import { getParameterByName } from './utils.js';

let url = window.location.href;

let code = getParameterByName('code', url);
let queryState = getParameterByName('state', url);
let error = getParameterByName('error', url);
let tokens = {
  access: Cookies.get('access_token'),
  refresh: Cookies.get('refresh_token'),
  psq: Cookies.get('psq_token')
};

ReactDOM.render(
  <App code={code} queryState={queryState} error={error} tokens={tokens} />,
  document.getElementById('app')
);
