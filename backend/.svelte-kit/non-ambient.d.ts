
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/admin-chat" | "/api/admin" | "/api/admin/stats" | "/api/auth" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/me" | "/api/auth/register" | "/api/bookings" | "/api/bookings/my" | "/api/bookings/[id]" | "/api/chat" | "/api/health" | "/api/rooms" | "/api/rooms/[id]" | "/api/users" | "/api/users/[id]";
		RouteParams(): {
			"/api/bookings/[id]": { id: string };
			"/api/rooms/[id]": { id: string };
			"/api/users/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/admin-chat": Record<string, never>;
			"/api/admin": Record<string, never>;
			"/api/admin/stats": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/auth/me": Record<string, never>;
			"/api/auth/register": Record<string, never>;
			"/api/bookings": { id?: string };
			"/api/bookings/my": Record<string, never>;
			"/api/bookings/[id]": { id: string };
			"/api/chat": Record<string, never>;
			"/api/health": Record<string, never>;
			"/api/rooms": { id?: string };
			"/api/rooms/[id]": { id: string };
			"/api/users": { id?: string };
			"/api/users/[id]": { id: string }
		};
		Pathname(): "/" | "/api/admin-chat" | "/api/admin/stats" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/me" | "/api/auth/register" | "/api/bookings" | "/api/bookings/my" | `/api/bookings/${string}` & {} | "/api/chat" | "/api/health" | "/api/rooms" | `/api/rooms/${string}` & {} | "/api/users" | `/api/users/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}