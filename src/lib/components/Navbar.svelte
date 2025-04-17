<script lang="ts">
	import { nyTime } from '$lib/stores/timeStore';
	import { page } from '$app/state';

	function formatTitle(path: string): string {
		if (!path) return 'Dashboard';
		const words = path.replace(/-/g, ' ').split(' ');
		return words.map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}
</script>

<nav class="flex w-full justify-between p-2 absolute sticky top-0 bg-white z-50 border-b border-gray-300">
	<div class="text-gray-600 font-bold">
		{formatTitle(page.url.pathname.split('/')[1])}
	</div>
	<div class="text-gray-600 font-bold">
		<span class="date">{$nyTime.dateString}</span>
		<span class="time">{$nyTime.timeString} (NY)</span>
	</div>
</nav>
