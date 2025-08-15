import admin from 'firebase-admin';

const rawServiceAccount = `{"type":"service_account","project_id":"all-in-one-career","private_key_id":"d805c630dbe9f88d8bc34c48b69fa343ebf77355","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDoMdlaeyeykFW3\\nC47Kbh92tILXk08fhfPUd281hPplfIuzxjqV1aKs+wAilSZpPlmdTUE32QI/5cgU\\neMkkzYsJVN0y6+w5ev/WdI0n3E0sw9CjSQlaxalQep/5jKDsKX7CsQEcK7Wj8J6M\\nPMZ1n2Iaq1mN4nl0w0q3OD0z8vHmzxmZRB6EJt4m4Qvzdq04e6RQ39vslZ9awZUx\\nutGFXaYcxarwqt39yEM0H09KDEvRc7DVIctI5b1OKYEwkxaf+4fbWe5iJyS5UuPA\\nbuOWUz+7bAw0E1uTfHKAYr0KdTP2qv4Bw1sVigFg13lfp4T2SxkHA/QEDSCbabr2\\nh/vLg+DPAgMBAAECgf8LI3h7L4gxPpdbzcHaaOc9bDn6C3nSLTyJqFmAdqG5Uw7H\\n4dD2onpcsoVYHt0FM++EYd+EqmaZpZ2iqh+vtj53d3/GqbeL2PNfcTxhupuEYc5m\\nBtwJNtmBJsOTUANIyjcLnagEL7HKWGtLpEBntOzJ9+wU/U8DK3qW/qJlwKAY+QtM\\ngJAWRw4Jt+P/maGqX7VxuGAVRtdixwlmQ6G+QiiQ2azzC8ddiwBgwBp84vpeQkkn\\nkFOTBtuz9HSJy84s8mtolUp7VAnELAhaH6BPdjhWQ49gE11PK8FFWGdBN4xW+9LI\\nWZc0OSOqepgBekEMPlIOAEX03Y+oU2m/FRY7s8ECgYEA/lY0a+Hg0Wh6DVLGWERZ\\nYaX/suxkKm6BIDFYW0bcZaDlFkoifLVyHQw9LpjCCPdcBKikWuKZFdBJkpyiRc1r\\nUdJk59exVxGBS24GvbwwyRhfyV4XdmVk0Mjzk4fbQPkhDrAKELwIU/u6DB4KwyUu\\nhwACUW34evZol7dIliwU+icCgYEA6baTUArnTGI3ekrBjfQFnMStEJMmOzmu3wbp\\nfWePATjE38ZNUKkga9PSPbzVZWcS0UTWhUrSRCpdXbbuCnbP36FnLQzpgLZ0gbHk\\n8abtts8VuM18kLjfzSt4Jcc5fDrc16pFQhfmxaYgDwn/7y9Vn4+pnCgIwj1NkC/M\\nvzoj1RkCgYEA+IP5IvUKPPQOVphsEHFwuNZ/3C/ZzBBAAdnVkRLTZkZpsnbr7dlJ\\n0JJV8gL3jdVNx4uVVO0XUlY8nZKJiRUoaUHgsR10PjRvlunCkoChVs2HQva6jEiU\\n0uGYB673ESydHYHrw+BHbvCIITD1qSrapLTgjvqakmPVXXGM7pfSQ38CgYB4AAiv\\nhomwjJWTsyKisnLXRZze788nhbymQzRL8YpZxD5B793u1ogRFVfT30tqn3vn+4Jy\\nOjKwUVhTMAQVV1/woT0KwqB6ODSmCyNUeLOBs96hXtDgtiwjenhcXWjEwqx2B7U7\\n9G3Hej7nueixdQpvvSIHTf8BTNywdfqZDU8ssQKBgHfXxUAQtpHxVNneGfV1ZAgp\\n09ib2P+DEANZeLXhedFWyJxcDYFIHQDWVF742gDbDXJNklfbY/JjpY5jJ1H9txPw\\nxx2DvP1cFoBPaiptXJe3xndu4Dp9TgzGUIqQ1XMbhhTLSXB4QahB7GYfyyPFkA4G\\nEMqKdzNlJiU/nWZgdbdh\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-fbsvc@all-in-one-career.iam.gserviceaccount.com","client_id":"100927814478151033533","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40all-in-one-career.iam.gserviceaccount.com","universe_domain":"googleapis.com"}`;

export const initFirebase = () => {
  if (admin.apps.length) return;
  const parsed = JSON.parse(rawServiceAccount);
  // Convert escaped \n into real newlines for the private key
  if (parsed?.private_key?.includes('\\n')) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  admin.initializeApp({
    credential: admin.credential.cert(parsed as admin.ServiceAccount),
  });
};

export const verifyIdToken = (idToken: string) =>
  admin.auth().verifyIdToken(idToken);
