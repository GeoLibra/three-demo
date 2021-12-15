import React from 'react';
import ReactDOM from 'react-dom';
import { Map } from './map.js';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <Map />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
