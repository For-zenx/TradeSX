<script lang="ts">
    import { page } from '$app/state';
</script>

<div class="w-12 h-screen sticky top-0 border-r border-gray-300 bg-gray-100 flex flex-col items-center gap-y-2">
    <a href="/" class="hover:bg-gray-200 rounded block flex justify-center p-2 {(page.url.pathname === '/') ? 'bg-gray-200' : ''}" aria-label="Dashboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024"><path fill="#334155" d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32z" stroke-width="25.5" stroke="#334155"/></svg>
    </a>
    <a href="/trades" class="hover:bg-gray-200 rounded block flex justify-center p-2 {(page.url.pathname === '/trades') ? 'bg-gray-200' : ''}" aria-label="Trades">
        <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#334155" d="m8 2l-.707-.707L8 .586l.707.707zm1 15a1 1 0 1 1-2 0zM2.293 6.293l5-5l1.414 1.414l-5 5zm6.414-5l5 5l-1.414 1.414l-5-5zM9 2v15H7V2zm7 20l-.707.707l.707.707l.707-.707zm1-15a1 1 0 1 0-2 0zm-6.707 10.707l5 5l1.414-1.414l-5-5zm6.414 5l5-5l-1.414-1.414l-5 5zM17 22V7h-2v15z" stroke-width="0.5" stroke="#334155"/></svg>
    </a>
</div>