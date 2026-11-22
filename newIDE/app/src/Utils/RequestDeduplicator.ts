class RequestDeduplicator<T, Args extends Array<any> = Array<any>> {
  _promise: Promise<T> | null = null;
  _requestSender: (...args: Args) => Promise<T>;

  constructor(requestSender: (...args: Args) => Promise<T>) {
    this._requestSender = requestSender;
  }

  launchRequestOrGetOngoingPromise(requestSenderArgs: Args): Promise<T> {
    if (!this._promise) {
      this._promise = this._requestSender(...requestSenderArgs).finally(() => {
        this._promise = null;
      });
    }
    return this._promise;
  }
}

export default RequestDeduplicator;
