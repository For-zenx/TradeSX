<script lang="ts">
    import { page } from '$app/state';
</script>

<div class="w-12 h-screen sticky top-0 border-r border-gray-300 bg-gray-100">
    <a href="/trades" class="hover:bg-gray-200 rounded block flex justify-center p-2 mt-3 mx-1 {(page.url.pathname === '/trades') ? 'bg-gray-200' : ''}" aria-label="Trades">
        <svg width="28" height="28" viewBox="0 0 24 24"><path fill="#334155" d="m8 2l-.707-.707L8 .586l.707.707zm1 15a1 1 0 1 1-2 0zM2.293 6.293l5-5l1.414 1.414l-5 5zm6.414-5l5 5l-1.414 1.414l-5-5zM9 2v15H7V2zm7 20l-.707.707l.707.707l.707-.707zm1-15a1 1 0 1 0-2 0zm-6.707 10.707l5 5l1.414-1.414l-5-5zm6.414 5l5-5l-1.414-1.414l-5 5zM17 22V7h-2v15z" stroke-width="0.5" stroke="#334155"/></svg>
    </a>
</div>