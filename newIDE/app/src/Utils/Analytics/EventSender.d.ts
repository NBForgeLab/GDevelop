export declare const sendErrorMessage: (
  message: string,
  type:
    | 'error'
    | 'error-boundary_mainframe'
    | 'error-boundary_list-search-result'
    | 'error-boundary_box-search-result'
    | 'error-boundary_app'
    | 'error-boundary_extension-loader',
  rawError: any,
  errorId: string
) => void;
