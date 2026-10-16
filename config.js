"use strict";
/* Site settings. Replace the placeholders before launch (see DEPLOY.md). */
const CONFIG = {
  phone: "(000) 000-0000",
  email: "hello@example.com",
  /* Optional HTTPS endpoint that accepts the encrypted quote request as JSON (e.g. a Cloudflare Worker, Formspree or Netlify function).
     Leave empty to send the encrypted request by email instead. The endpoint only ever receives ciphertext. */
  formEndpoint: "",
  /* Public half of the RSA key used to encrypt quote requests in the visitor's browser. The private half lives only with the owner. */
  publicKey: {"kty":"RSA","n":"wJb94sdqwMS4oSkvaadmiC82SXMn04x0X2h42OVTOvHtkjUOfL6viXLdUmQjd8gaPpiLb-GsDaXVWYefTBVX9TDvsfv6G4YEiF_jIIgIgsY5ESniqvKxk2JOvyaJExQHXUA6Bg_mP-D8PzQLoNO8-z5PalwSegUp3VMGsT--H5i2L7m5Mw-t6C0z8mc9PiEuMFAbg9YKZh9F3fJJNdUPN7A5tNBT5BkFTPEHV8TLtlg5rjz3RusnMToRcOJrCGPa9wrjZPheuhAalCrxeh_3lSkn3-THiRcB1PX-h7WGK6IxlbeACG_sPY1iqQ_BN3Ccq7W1wDbpaaCyC2nLmsGOx6_lym5sE5ujB4qbXQbnaNj3Lci2z8oKJHORKYP4k5VXa0G_fbrwjZNYQEOshGgrIsid_1DGscEDF8JiTPrHTwziL_rlRyy09jxPBDphwO_P7SNjFVlZ71myyVvIg4hmOopHpmvrk1V27CbSMpG4_-3LLYPXqKvKh7rq9hfoFNtF","e":"AQAB","alg":"RSA-OAEP-256","ext":true,"key_ops":["encrypt"]}
};
