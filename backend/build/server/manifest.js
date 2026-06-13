const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BcMEuTrP.js",app:"_app/immutable/entry/app.BT4U5rVd.js",imports:["_app/immutable/entry/start.BcMEuTrP.js","_app/immutable/chunks/BVYBEAMN.js","_app/immutable/chunks/BExlx1mT.js","_app/immutable/entry/app.BT4U5rVd.js","_app/immutable/chunks/BExlx1mT.js","_app/immutable/chunks/CC4oXkAW.js","_app/immutable/chunks/BBx9jlSs.js","_app/immutable/chunks/qa_0k5dF.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-DN_B1hnA.js')),
			__memo(() => import('./chunks/1-D4Qi-bFQ.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/api/admin-chat",
				pattern: /^\/api\/admin-chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DJWDo6xn.js'))
			},
			{
				id: "/api/admin/stats",
				pattern: /^\/api\/admin\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C4Ud7nof.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-WUhm1n4K.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-j6_l2z_C.js'))
			},
			{
				id: "/api/auth/me",
				pattern: /^\/api\/auth\/me\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Y7vc7uSS.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DNxhT4cs.js'))
			},
			{
				id: "/api/bookings",
				pattern: /^\/api\/bookings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-mAy8qIVu.js'))
			},
			{
				id: "/api/bookings/my",
				pattern: /^\/api\/bookings\/my\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C1y4s99J.js'))
			},
			{
				id: "/api/bookings/[id]",
				pattern: /^\/api\/bookings\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-_glMackQ.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Dmuyngc8.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BN_Fer2K.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CzZzw3X-.js'))
			},
			{
				id: "/api/rooms/[id]",
				pattern: /^\/api\/rooms\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-rXelgTn1.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-kWd9vnQN.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-nPd-mLs2.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
