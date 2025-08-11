import axios from "axios";

const PAYU_API_URL =
  "https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi";

interface Auth {
  apiLogin: string;
  apiKey: string;
}

interface PayUResponse {
  code: string;
  error: string | null;
  result: Record<string, unknown>;
}

export async function consultOrderById(
  orderId: number,
  auth: Auth,
): Promise<PayUResponse> {
  const requestBody = {
    test: false,
    language: "en",
    command: "ORDER_DETAIL",
    merchant: auth,
    details: {
      orderId,
    },
  };

  const response = await axios.post<PayUResponse>(PAYU_API_URL, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

export async function consultTransactionById(
  transactionId: string,
  auth: Auth,
): Promise<PayUResponse> {
  const requestBody = {
    test: false,
    language: "en",
    command: "TRANSACTION_RESPONSE_DETAIL",
    merchant: auth,
    details: {
      transactionId,
    },
  };

  const response = await axios.post<PayUResponse>(PAYU_API_URL, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

export async function consultOrderByReferenceCode(
  referenceCode: string,
  auth: Auth,
): Promise<PayUResponse> {
  const requestBody = {
    test: false,
    language: "en",
    command: "ORDER_DETAIL_BY_REFERENCE_CODE",
    merchant: auth,
    details: {
      referenceCode,
    },
  };

  const response = await axios.post<PayUResponse>(PAYU_API_URL, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}
