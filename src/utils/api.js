import request from './request'

export function translate(content) {

  const params = [
    'client=gtx',
    `sl=en`,
    `tl=zh-cn`,
    'hl=en-US',
    'dt=t',
    'dt=bd',
    'dj=1',
    'source=input',
    'tk=29979.29979',
    `q=${content}`
  ].join('&');

  return request({
    url: `https://translate.googleapis.com/translate_a/single?${params}`,
    method: 'get'
  });
}

export function tts(word) {

  return request({
    url: `https://translate.google.com/translate_tts?ie=UTF-8&idx=0&tl=en&client=dict-chrome-ex&total=1&textlen=4&q=${encodeURIComponent(word)}&ttsspeed=1`,
    method: 'get',
    responseType: 'arraybuffer',
  });
}
