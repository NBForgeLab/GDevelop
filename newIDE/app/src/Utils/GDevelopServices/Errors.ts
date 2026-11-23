export type ExtractedErrorStatusAndCode = {
  status: number;
  code: string | null | undefined;
  data?: Record<string, any> | null;
};

/**
 * Given any error, check if the error is an error thrown by Axios, if it contains a response from the server,
 * and if so, try to get the HTTP status and the code returned by the GDevelop API.
 * If the error is not an axios error or does not contain a response, `null` is returned.
 */
export const extractGDevelopApiErrorStatusAndCode = (
  error: unknown
): ExtractedErrorStatusAndCode | null => {
  if (!error) return null;
  if (typeof error != 'object') return null;

  const response = 'response' in error ? error.response : undefined;
  if (
    // Ensure a response was received
    typeof response === 'object' &&
    response &&
    'status' in response &&
    // Ensure status exists (https://axios-http.com/docs/handling_errors)
    typeof response.status === 'number'
  ) {
    const responseData = 'data' in response ? response.data : undefined;
    const isValidDataObject =
      typeof responseData === 'object' && responseData !== null;
    return {
      status: response.status,
      code:
        // Ensure data exists (https://axios-http.com/docs/handling_errors)
        isValidDataObject &&
        'code' in responseData &&
        typeof responseData.code === 'string'
          ? responseData.code
          : null,
      data:
        isValidDataObject &&
        'data' in responseData &&
        typeof responseData.data === 'object'
          ? (responseData.data as Record<string, any> | null)
          : null,
    };
  }

  return null;
};
