
export function debounce(func, wait) {

  let timer;

  return function () {

    let context = this; // 注意 this 指向
    let args = arguments; // arguments中存着event

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(function () {
      func.apply(context, args);
    }, wait);

  }
}
