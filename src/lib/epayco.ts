
/* eslint-disable */

import epayco from 'epayco-sdk-node';

const epaycoInstance = epayco({
  apiKey: process.env.EPAYCO_PUBLIC_KEY ?? '',
  privateKey: process.env.EPAYCO_PRIVATE_KEY ?? '',
  lang: 'ES',
  test: true,
});

export async function createToken(cardData: {
  "card[number]": string,
  "card[exp_year]": string,
  "card[exp_month]": string,
  "card[cvc]": string
}): Promise<any> {
  return new Promise((resolve, reject) => {
    epaycoInstance.token.create(cardData)
      .then(token => resolve(token))
      .catch(error => reject(error));
  });
}

export async function createCustomer(tokenId: string, name: string, email: string): Promise<any> {
  const customerInfo = {
    token_card: tokenId,
    name: name,
    email: email,
    default: true,
  };

  return new Promise((resolve, reject) => {
    epaycoInstance.customers.create(customerInfo)
      .then(customer => resolve(customer))
      .catch(error => reject(error));
  });
}

export async function createSubscription(subscriptionInfo: {
  id_plan: string,
  customer: string,
  token_card: string,
  doc_type: string,
  doc_number: string,
  url_confirmation: string,
  method_confirmation: string,
}): Promise<any> {
  return new Promise((resolve, reject) => {
    epaycoInstance.subscriptions.create(subscriptionInfo)
      .then(subscription => resolve(subscription))
      .catch(error => reject(error));
  });
}
