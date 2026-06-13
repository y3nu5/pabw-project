import { j as json } from './index-lhTMmBNn.js';
import { a as clearAuthCookie } from './auth-CKVeimI7.js';
import 'bcryptjs';
import 'jsonwebtoken';
import './shared-server-cF6ckHns.js';

async function POST({ cookies }) {
  clearAuthCookie(cookies);
  return json({
    message: "Logout berhasil."
  });
}

export { POST };
//# sourceMappingURL=_server-j6_l2z_C.js.map
