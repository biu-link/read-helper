import axios from 'axios'
import fetchAdapter from '@vespaiach/axios-fetch-adapter'

// axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 创建axios实例
const service = axios.create({
  // 超时
  timeout: 10000,
  adapter: fetchAdapter
});

export default service
