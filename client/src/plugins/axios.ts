import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';

let http;
if (axios.defaults.adapter) {
  http = axios.create({
    baseURL: '/',
    headers: {'Cache-Control': 'no-cache'},
    // cache will be enabled by default
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false, cacheFlag: 'useCache'})
  });
} else {
  http = axios.create({
    baseURL: '/',
    headers: {'Cache-Control': 'no-cache'}
  });
}

export default http;
