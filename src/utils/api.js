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
