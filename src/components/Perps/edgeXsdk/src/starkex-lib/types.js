export var NetworkId;
(function (NetworkId) {
  NetworkId[(NetworkId['MAINNET'] = 1)] = 'MAINNET';
  NetworkId[(NetworkId['GOERLI'] = 5)] = 'GOERLI';
})(NetworkId || (NetworkId = {}));
export var StarkwareOrderType;
(function (StarkwareOrderType) {
  StarkwareOrderType['LIMIT_ORDER_WITH_FEES'] = 'LIMIT_ORDER_WITH_FEES';
})(StarkwareOrderType || (StarkwareOrderType = {}));
// ============ API Request Parameters ============
export var ApiMethod;
(function (ApiMethod) {
  ApiMethod['POST'] = 'POST';
  ApiMethod['PUT'] = 'PUT';
  ApiMethod['GET'] = 'GET';
  ApiMethod['DELETE'] = 'DELETE';
})(ApiMethod || (ApiMethod = {}));
