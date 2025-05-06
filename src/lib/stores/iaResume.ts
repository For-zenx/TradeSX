import { writable } from 'svelte/store';

interface IAResume {
    tradesCount?: string;
    generalResume?: string;
    drawdown?: string;
    weekdayPerformance?: string;
}

export const iaResumeStore = writable<IAResume>({});

export const updateIAResume = (section: keyof IAResume, content: string) => {
    iaResumeStore.update(current => ({
        ...current,
        [section]: content
    }));
};

export const getFullResume = () => {
    let fullResume = '';
    iaResumeStore.subscribe(resume => {
        fullResume = Object.values(resume)
            .filter(Boolean)
            .join('\n\n');
    })();
    return fullResume;
};