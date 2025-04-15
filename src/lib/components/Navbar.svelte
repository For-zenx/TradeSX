<script lang="ts">
	import { nyTime } from '$lib/stores/timeStore';
</script>

<nav class="flex w-full justify-end p-2">
	<div class="text-gray-600 font-bold">
		<span class="date">{$nyTime.dateString}</span>
		<span class="time">{$nyTime.timeString} (NY)</span>
	</div>
</nav>
