export const manifest = (() => {
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
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/api/admin-chat",
				pattern: /^\/api\/admin-chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin-chat/_server.js'))
			},
			{
				id: "/api/admin/stats",
				pattern: /^\/api\/admin\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/stats/_server.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/login/_server.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.js'))
			},
			{
				id: "/api/auth/me",
				pattern: /^\/api\/auth\/me\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/me/_server.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/register/_server.js'))
			},
			{
				id: "/api/bookings",
				pattern: /^\/api\/bookings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bookings/_server.js'))
			},
			{
				id: "/api/bookings/my",
				pattern: /^\/api\/bookings\/my\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bookings/my/_server.js'))
			},
			{
				id: "/api/bookings/[id]",
				pattern: /^\/api\/bookings\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bookings/_id_/_server.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/_server.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/rooms/_server.js'))
			},
			{
				id: "/api/rooms/[id]",
				pattern: /^\/api\/rooms\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/rooms/_id_/_server.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_server.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_id_/_server.js'))
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
