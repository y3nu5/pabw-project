<script>
  import '../app.css';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { API_BASE_URL } from '$lib/config/api';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ChatWidget from '$lib/components/ChatWidget.svelte';

  let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));

  onMount(() => {
    // Intersept fetch di browser untuk menyisipkan header Authorization (Bearer Token)
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : (input?.url || '');
      if (url.startsWith(API_BASE_URL)) {
        const match = document.cookie.match(/auth_token=([^;]+)/);
        const token = match ? match[1] : null;
        if (token) {
          init = init || {};
          init.headers = init.headers || {};
          
          if (!init.headers['Authorization'] && !init.headers['authorization']) {
            if (init.headers instanceof Headers) {
              init.headers.set('Authorization', `Bearer ${token}`);
            } else if (Array.isArray(init.headers)) {
              init.headers.push(['Authorization', `Bearer ${token}`]);
            } else {
              init.headers['Authorization'] = `Bearer ${token}`;
            }
          }
        }
      }
      return originalFetch.call(this, input, init);
    };
  });
</script>

{#if !isAdminRoute}
  <Header />
{/if}

<main class:pt-20={!isAdminRoute}>
  <slot />
</main>

{#if !isAdminRoute}
  <Footer />
  <ChatWidget />
{/if}
