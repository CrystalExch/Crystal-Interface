export default function customRound(num: number, sigs: number) {
  if (sigs == 0) {
    return String(Math.round(num));
  }
  if (num < 1) {
    return num.toPrecision(sigs);
  } else {
    if (num > 100000) {
      return num.toFixed(0);
    }
    else if (num > 10000) {
      return num.toFixed(1);
    }
    return num.toFixed(2);
  }
}
