export const debounce = (callback: (...args: any) => void, delay: number) => {
  let timeoutId: number | undefined;
  return (...args: any) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}