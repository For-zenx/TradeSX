<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
  
	let { children } = $props();
  </script>
  

  
  <div class="flex min-h-screen">
	<Sidebar />
	<div class="flex-1 flex flex-col">
		<Navbar />
	  <main class="flex-1 overflow-x-hidden overflow-y-auto p-2">
		{@render children()}
	  </main>
	</div>
  </div>