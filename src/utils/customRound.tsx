export default function customRound(num: number, sigs: number) {
  if (sigs == 0) {
    return String(Math.round(num));
  }
  if (num < 1) {
    return num.toPrecision(sigs);
  } else {
    return num.toFixed(2);
  }
}
