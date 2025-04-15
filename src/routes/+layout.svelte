<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
  
	let { children } = $props();
  </script>
  
  <div class="flex min-h-screen">
	<!-- Sidebar -->
	<Sidebar />
  
	<!-- Contenido principal -->
	<div class="flex-1 flex flex-col">
	  <!-- Navbar fijo -->
		<Navbar />
  
	  <!-- Área de contenido desplazable -->
	  <main class="flex-1 overflow-y-auto p-6">
		{@render children()}
	  </main>
	</div>
  </div>